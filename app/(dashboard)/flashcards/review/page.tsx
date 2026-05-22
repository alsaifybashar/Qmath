import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Layers } from 'lucide-react';
import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { eq, and, gte } from 'drizzle-orm';
import { flashcardReviews } from '@/db/dashboard-schema';
import { getDueFlashcards } from '@/app/actions/flashcards';
import ReviewClient from './ReviewClient';

export const metadata = {
    title: 'Repetera flashcards | Qmath',
};

export default async function FlashcardReviewPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/flashcards/review');
    }
    const userId = session.user.id;

    const dueCards = await getDueFlashcards(40);

    // Determine whether this is the first review of the day for the flame chip
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const reviewedTodayRows = await db
        .select({ id: flashcardReviews.id })
        .from(flashcardReviews)
        .where(
            and(
                eq(flashcardReviews.userId, userId),
                gte(flashcardReviews.reviewedAt, todayStart),
            ),
        )
        .limit(1);
    const isFirstReviewOfDay = reviewedTodayRows.length === 0;

    if (dueCards.length === 0) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16 text-center text-white">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-blue-400 shadow-lg shadow-emerald-500/30">
                    <Layers className="h-8 w-8 text-zinc-950" />
                </div>
                <h1 className="text-2xl font-bold">Inga kort att repetera</h1>
                <p className="mt-2 text-sm text-white/60">
                    Du är ikapp! Nya kort hamnar här när de blir aktuella enligt FSRS-schemat.
                </p>
                <Link
                    href="/flashcards"
                    className="mt-6 inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-bold text-zinc-950 transition hover:bg-emerald-100"
                >
                    Tillbaka till översikten
                </Link>
            </div>
        );
    }

    return (
        <ReviewClient cards={dueCards} isFirstReviewOfDay={isFirstReviewOfDay} />
    );
}
