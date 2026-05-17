'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { articles, questions, topics } from '@/db/schema';
import {
    flashcardCardState,
    flashcardDecks,
    flashcardReviews,
    flashcards,
    userAchievements,
    userStreaks,
} from '@/db/dashboard-schema';
import { awardXP } from '@/app/actions/city';
import { draftCards, type CardDraft } from '@/lib/flashcards/ai-draft';
import { applyReview, initialState, RATING_XP, type CardStateRow, type Rating } from '@/lib/flashcards/fsrs';
import { bucketFor, BUCKET_LABEL_SV, type StateBucket } from '@/lib/flashcards/state-buckets';
import { and, asc, desc, eq, lte, sql } from 'drizzle-orm';

export type FlashcardSourceContextType = 'manual' | 'question' | 'article' | 'ai_draft';

export interface FlashcardDeckSummary {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    topicId: string | null;
    totalCards: number;
    dueCards: number;
    lastReviewedAt: Date | null;
}

export interface FlashcardWithState {
    id: string;
    deckId: string;
    topicId: string | null;
    front: string;
    back: string;
    frontMath: string | null;
    backMath: string | null;
    sourceContextType: string | null;
    sourceContextId: string | null;
    createdAt: Date;
    state: CardStateRow;
    bucket: StateBucket;
    bucketLabel: string;
}

export interface FlashcardDashboard {
    decks: FlashcardDeckSummary[];
    dueCards: FlashcardWithState[];
    recentCards: FlashcardWithState[];
    stats: {
        totalCards: number;
        dueCards: number;
        cardsReviewedToday: number;
        averageRecall: number;
        currentStreak: number;
        longTermCards: number;
    };
}

export interface CreateFlashcardInput {
    deckId?: string;
    deckName?: string;
    topicId?: string | null;
    front: string;
    back: string;
    frontMath?: string | null;
    backMath?: string | null;
    sourceContextType?: FlashcardSourceContextType;
    sourceContextId?: string | null;
}

export interface DraftFlashcardsInput {
    snippet?: string;
    topicName?: string;
    contextType?: FlashcardSourceContextType;
    maxDrafts?: number;
}

export interface FlashcardReviewResult {
    card: FlashcardWithState;
    xpAwarded: number;
    achievementIds: string[];
}

async function requireUserId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Not authenticated');
    }
    return session.user.id;
}

function rowToState(row: typeof flashcardCardState.$inferSelect): CardStateRow {
    return {
        cardId: row.cardId,
        stability: row.stability ?? 0,
        difficulty: row.difficulty ?? 0,
        elapsedDays: row.elapsedDays ?? 0,
        scheduledDays: row.scheduledDays ?? 0,
        reps: row.reps ?? 0,
        lapses: row.lapses ?? 0,
        state: row.state as CardStateRow['state'],
        lastReview: row.lastReview ?? null,
        nextReview: row.nextReview,
    };
}

function toFlashcardWithState(row: {
    card: typeof flashcards.$inferSelect;
    state: typeof flashcardCardState.$inferSelect;
}): FlashcardWithState {
    const state = rowToState(row.state);
    const bucket = bucketFor(state);
    return {
        id: row.card.id,
        deckId: row.card.deckId,
        topicId: row.card.topicId,
        front: row.card.front ?? '',
        back: row.card.back ?? '',
        frontMath: row.card.frontMath,
        backMath: row.card.backMath,
        sourceContextType: row.card.sourceContextType,
        sourceContextId: row.card.sourceContextId,
        createdAt: row.card.createdAt,
        state,
        bucket,
        bucketLabel: BUCKET_LABEL_SV[bucket],
    };
}

async function getOrCreateDeck(userId: string, input: Pick<CreateFlashcardInput, 'deckId' | 'deckName' | 'topicId'>) {
    if (input.deckId) {
        const [deck] = await db
            .select()
            .from(flashcardDecks)
            .where(and(eq(flashcardDecks.id, input.deckId), eq(flashcardDecks.userId, userId)))
            .limit(1);
        if (deck) return deck;
    }

    const deckName = input.deckName?.trim() || 'Mina flashcards';
    const [existing] = await db
        .select()
        .from(flashcardDecks)
        .where(and(eq(flashcardDecks.userId, userId), eq(flashcardDecks.name, deckName)))
        .limit(1);

    if (existing) return existing;

    const id = crypto.randomUUID();
    const now = new Date();
    await db.insert(flashcardDecks).values({
        id,
        userId,
        name: deckName,
        description: 'Snabbt skapade kort från Qmath',
        color: 'emerald',
        topicId: input.topicId ?? null,
        createdAt: now,
        updatedAt: now,
    });

    const [created] = await db.select().from(flashcardDecks).where(eq(flashcardDecks.id, id)).limit(1);
    return created;
}

async function upsertFlashcardAchievement(
    userId: string,
    achievementId: string,
    category: 'learning' | 'habits' | 'growth' = 'learning',
    metadata?: Record<string, unknown>,
): Promise<string | null> {
    const [existing] = await db
        .select({ id: userAchievements.id })
        .from(userAchievements)
        .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)))
        .limit(1);

    if (existing) return null;

    await db.insert(userAchievements).values({
        id: crypto.randomUUID(),
        userId,
        achievementId,
        category,
        metadata: metadata ? JSON.stringify(metadata) : null,
        earnedAt: new Date(),
    });

    return achievementId;
}

async function maintainFlashcardStreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [current] = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId)).limit(1);

    if (!current) {
        await db.insert(userStreaks).values({
            userId,
            currentStreak: 1,
            longestStreak: 1,
            lastStudyDate: today,
            totalStudyDays: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return 1;
    }

    const last = current.lastStudyDate ? new Date(current.lastStudyDate) : null;
    last?.setHours(0, 0, 0, 0);

    if (last?.getTime() === today.getTime()) {
        return current.currentStreak ?? 1;
    }

    const nextStreak = last?.getTime() === yesterday.getTime()
        ? (current.currentStreak ?? 0) + 1
        : 1;

    await db
        .update(userStreaks)
        .set({
            currentStreak: nextStreak,
            longestStreak: Math.max(current.longestStreak ?? 0, nextStreak),
            lastStudyDate: today,
            totalStudyDays: (current.totalStudyDays ?? 0) + 1,
            updatedAt: new Date(),
        })
        .where(eq(userStreaks.userId, userId));

    return nextStreak;
}

async function getCardsWithState(userId: string, whereSql?: ReturnType<typeof and>, limit = 20) {
    const baseWhere = whereSql
        ? and(eq(flashcards.userId, userId), whereSql)
        : eq(flashcards.userId, userId);

    const rows = await db
        .select({ card: flashcards, state: flashcardCardState })
        .from(flashcards)
        .innerJoin(flashcardCardState, eq(flashcards.id, flashcardCardState.cardId))
        .where(baseWhere)
        .orderBy(asc(flashcardCardState.nextReview))
        .limit(limit);

    return rows.map(toFlashcardWithState);
}

export async function getFlashcardDashboard(): Promise<FlashcardDashboard | null> {
    const session = await auth();
    if (!session?.user?.id) return null;

    const userId = session.user.id;
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [deckRows, allCards, dueCards, reviewedToday, streakRow] = await Promise.all([
        db
            .select({
                deck: flashcardDecks,
                totalCards: sql<number>`count(${flashcards.id})`,
                dueCards: sql<number>`sum(case when ${flashcardCardState.nextReview} <= ${now.getTime()} then 1 else 0 end)`,
                lastReviewedAt: sql<number | null>`max(${flashcardCardState.lastReview})`,
            })
            .from(flashcardDecks)
            .leftJoin(flashcards, eq(flashcards.deckId, flashcardDecks.id))
            .leftJoin(flashcardCardState, eq(flashcards.id, flashcardCardState.cardId))
            .where(eq(flashcardDecks.userId, userId))
            .groupBy(flashcardDecks.id)
            .orderBy(desc(sql`max(${flashcardDecks.updatedAt})`)),
        db
            .select({ card: flashcards, state: flashcardCardState })
            .from(flashcards)
            .innerJoin(flashcardCardState, eq(flashcards.id, flashcardCardState.cardId))
            .where(eq(flashcards.userId, userId)),
        getCardsWithState(userId, lte(flashcardCardState.nextReview, now), 20),
        db
            .select({ count: sql<number>`count(*)`, avgRating: sql<number>`avg(${flashcardReviews.rating})` })
            .from(flashcardReviews)
            .where(and(eq(flashcardReviews.userId, userId), sql`${flashcardReviews.reviewedAt} >= ${today.getTime()}`)),
        db.select().from(userStreaks).where(eq(userStreaks.userId, userId)).limit(1),
    ]);

    const cards = allCards.map(toFlashcardWithState);
    const decks: FlashcardDeckSummary[] = deckRows.map((row) => ({
        id: row.deck.id,
        name: row.deck.name,
        description: row.deck.description,
        color: row.deck.color,
        topicId: row.deck.topicId,
        totalCards: Number(row.totalCards ?? 0),
        dueCards: Number(row.dueCards ?? 0),
        lastReviewedAt: row.lastReviewedAt ? new Date(row.lastReviewedAt) : null,
    }));

    return {
        decks,
        dueCards,
        recentCards: cards
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 12),
        stats: {
            totalCards: cards.length,
            dueCards: dueCards.length,
            cardsReviewedToday: Number(reviewedToday[0]?.count ?? 0),
            averageRecall: Math.round(((Number(reviewedToday[0]?.avgRating ?? 0) - 1) / 3) * 100) || 0,
            currentStreak: streakRow[0]?.currentStreak ?? 0,
            longTermCards: cards.filter((card) => card.bucket === 'langtidsminne').length,
        },
    };
}

export async function getDueFlashcards(limit = 20): Promise<FlashcardWithState[]> {
    const userId = await requireUserId();
    return getCardsWithState(userId, lte(flashcardCardState.nextReview, new Date()), limit);
}

export async function createFlashcardDeck(input: {
    name: string;
    description?: string | null;
    color?: string | null;
    topicId?: string | null;
}) {
    const userId = await requireUserId();
    const now = new Date();
    const id = crypto.randomUUID();

    await db.insert(flashcardDecks).values({
        id,
        userId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        color: input.color || 'emerald',
        topicId: input.topicId ?? null,
        createdAt: now,
        updatedAt: now,
    });

    revalidatePath('/flashcards');
    return { id };
}

export async function createFlashcard(input: CreateFlashcardInput): Promise<FlashcardWithState> {
    const userId = await requireUserId();
    const front = input.front.trim();
    const back = input.back.trim();
    if (!front || !back) {
        throw new Error('Front and back are required');
    }

    const deck = await getOrCreateDeck(userId, input);
    const id = crypto.randomUUID();
    const now = new Date();
    const state = initialState(id);

    await db.insert(flashcards).values({
        id,
        userId,
        deckId: deck.id,
        topicId: input.topicId ?? deck.topicId ?? null,
        type: 'basic',
        front,
        back,
        frontMath: input.frontMath?.trim() || null,
        backMath: input.backMath?.trim() || null,
        sourceContextType: input.sourceContextType ?? 'manual',
        sourceContextId: input.sourceContextId ?? null,
        createdAt: now,
        updatedAt: now,
    });

    await db.insert(flashcardCardState).values({
        cardId: id,
        userId,
        stability: state.stability,
        difficulty: state.difficulty,
        elapsedDays: state.elapsedDays,
        scheduledDays: state.scheduledDays,
        reps: state.reps,
        lapses: state.lapses,
        state: state.state,
        lastReview: state.lastReview,
        nextReview: state.nextReview,
    });

    await db.update(flashcardDecks).set({ updatedAt: now }).where(eq(flashcardDecks.id, deck.id));
    await awardXP({ xpAmount: 5, reason: 'flashcard', metadata: { action: 'created', cardId: id } });
    await upsertFlashcardAchievement(userId, 'first_flashcard_created', 'learning', { cardId: id });

    revalidatePath('/flashcards');
    return (await getCardsWithState(userId, eq(flashcards.id, id), 1))[0];
}

export async function draftFlashcardsFromContext(input: DraftFlashcardsInput): Promise<CardDraft[]> {
    await requireUserId();
    return draftCards({
        snippet: input.snippet,
        topicName: input.topicName,
        contextType: input.contextType,
        maxDrafts: input.maxDrafts ?? 3,
    });
}

export async function reviewFlashcard(cardId: string, rating: Rating): Promise<FlashcardReviewResult> {
    const userId = await requireUserId();

    const [row] = await db
        .select({ card: flashcards, state: flashcardCardState })
        .from(flashcards)
        .innerJoin(flashcardCardState, eq(flashcards.id, flashcardCardState.cardId))
        .where(and(eq(flashcards.id, cardId), eq(flashcards.userId, userId)))
        .limit(1);

    if (!row) throw new Error('Card not found');

    const next = applyReview(rowToState(row.state), rating);
    const reviewedAt = new Date();

    await db
        .update(flashcardCardState)
        .set({
            stability: next.stability,
            difficulty: next.difficulty,
            elapsedDays: next.elapsedDays,
            scheduledDays: next.scheduledDays,
            reps: next.reps,
            lapses: next.lapses,
            state: next.state,
            lastReview: next.lastReview,
            nextReview: next.nextReview,
        })
        .where(eq(flashcardCardState.cardId, cardId));

    await db.insert(flashcardReviews).values({
        id: crypto.randomUUID(),
        userId,
        cardId,
        reviewedAt,
        rating,
        elapsedDays: next.elapsedDays,
        scheduledDays: next.scheduledDays,
        stability: next.stability,
        difficulty: next.difficulty,
        state: next.state,
        lapses: next.lapses,
    });

    const xpAwarded = RATING_XP[rating];
    await awardXP({ xpAmount: xpAwarded, reason: 'flashcard', metadata: { action: 'reviewed', cardId, rating } });
    const streak = await maintainFlashcardStreak(userId);

    const achievementIds: string[] = [];
    const firstReview = await upsertFlashcardAchievement(userId, 'first_flashcard_review', 'learning', { cardId });
    if (firstReview) achievementIds.push(firstReview);
    if (streak >= 7) {
        const streakAchievement = await upsertFlashcardAchievement(userId, 'flashcard_streak_7', 'habits', { streak });
        if (streakAchievement) achievementIds.push(streakAchievement);
    }
    if (next.stability >= 30) {
        const longTerm = await upsertFlashcardAchievement(userId, 'first_long_term_flashcard', 'learning', { cardId });
        if (longTerm) achievementIds.push(longTerm);
    }

    revalidatePath('/flashcards');
    const [card] = await getCardsWithState(userId, eq(flashcards.id, cardId), 1);
    return { card, xpAwarded, achievementIds };
}

export async function getFlashcardCaptureContext(
    sourceContextType: FlashcardSourceContextType,
    sourceContextId: string,
) {
    const session = await auth();
    if (!session?.user?.id) return null;

    if (sourceContextType === 'question') {
        const [row] = await db
            .select({
                id: questions.id,
                text: questions.contentMarkdown,
                topicId: questions.topicId,
                topicTitle: topics.title,
            })
            .from(questions)
            .leftJoin(topics, eq(questions.topicId, topics.id))
            .where(eq(questions.id, sourceContextId))
            .limit(1);
        return row ?? null;
    }

    if (sourceContextType === 'article') {
        const [row] = await db
            .select({
                id: articles.id,
                text: articles.excerpt,
                topicId: articles.topicId,
                title: articles.title,
            })
            .from(articles)
            .where(eq(articles.id, sourceContextId))
            .limit(1);
        return row ?? null;
    }

    return null;
}
