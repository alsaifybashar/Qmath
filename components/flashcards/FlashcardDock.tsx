'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import {
    BookOpen,
    Check,
    ChevronRight,
    Layers,
    Loader2,
    Plus,
    Sparkles,
    Star,
    X,
    Zap,
} from 'lucide-react';
import {
    createFlashcard,
    draftFlashcardsFromContext,
    getDueFlashcards,
    getFlashcardDashboard,
    reviewFlashcard,
    type FlashcardDashboard,
    type FlashcardSourceContextType,
    type FlashcardWithState,
} from '@/app/actions/flashcards';
import type { CardDraft } from '@/lib/flashcards/ai-draft';
import type { Rating } from '@/lib/flashcards/fsrs';

const InlineMath = dynamic(
    () => import('react-katex').then((mod) => mod.InlineMath),
    { ssr: false },
);

type DockMode = 'closed' | 'add' | 'review';

interface CaptureContext {
    sourceContextType: FlashcardSourceContextType;
    sourceContextId?: string | null;
    topicId?: string | null;
    topicName?: string | null;
    snippet?: string;
}

declare global {
    interface WindowEventMap {
        'qmath:flashcard-context': CustomEvent<CaptureContext>;
    }
}

const ratingLabels: Record<Rating, string> = {
    1: 'Igen',
    2: 'Svår',
    3: 'Bra',
    4: 'Lätt',
};

function inferContext(pathname: string, selection: string): CaptureContext {
    const articleMatch = pathname.match(/^\/articles\/([^/]+)/);
    const questionView = pathname.startsWith('/question-view');
    const study = pathname.startsWith('/study');

    if (articleMatch) {
        return {
            sourceContextType: 'article',
            sourceContextId: decodeURIComponent(articleMatch[1]),
            snippet: selection,
        };
    }

    if (questionView || study) {
        return {
            sourceContextType: 'question',
            sourceContextId: null,
            snippet: selection,
        };
    }

    return {
        sourceContextType: 'manual',
        sourceContextId: null,
        snippet: selection,
    };
}

function draftToForm(draft: CardDraft) {
    return {
        front: draft.front,
        back: draft.back,
        frontMath: draft.frontMath ?? '',
        backMath: draft.backMath ?? '',
    };
}

export function FlashcardDock() {
    const pathname = usePathname();
    const [dashboard, setDashboard] = useState<FlashcardDashboard | null>(null);
    const [hasLoadedDashboard, setHasLoadedDashboard] = useState(false);
    const [mode, setMode] = useState<DockMode>('closed');
    const [context, setContext] = useState<CaptureContext>({ sourceContextType: 'manual' });
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [frontMath, setFrontMath] = useState('');
    const [backMath, setBackMath] = useState('');
    const [drafts, setDrafts] = useState<CardDraft[]>([]);
    const [reviewCards, setReviewCards] = useState<FlashcardWithState[]>([]);
    const [activeReviewIndex, setActiveReviewIndex] = useState(0);
    const [isAnswerVisible, setIsAnswerVisible] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const activeCard = reviewCards[activeReviewIndex];

    const selectedText = useMemo(() => {
        if (typeof window === 'undefined') return '';
        return window.getSelection()?.toString().trim() ?? '';
    }, [mode]);

    const refreshDashboard = () => {
        startTransition(async () => {
            const data = await getFlashcardDashboard();
            setDashboard(data);
            setHasLoadedDashboard(true);
        });
    };

    useEffect(() => {
        refreshDashboard();
    }, []);

    useEffect(() => {
        const handler = (event: CustomEvent<CaptureContext>) => {
            setContext((prev) => ({ ...prev, ...event.detail }));
        };
        window.addEventListener('qmath:flashcard-context', handler);
        return () => window.removeEventListener('qmath:flashcard-context', handler);
    }, []);

    const openAdd = () => {
        const selection = window.getSelection()?.toString().trim() ?? '';
        const inferred = inferContext(pathname, selection);
        const hasPageContext = Boolean(context.sourceContextId || context.topicId || context.topicName || context.snippet);
        const nextContext = {
            ...inferred,
            ...(hasPageContext ? context : {}),
            snippet: selection || context.snippet || '',
        };
        setContext(nextContext);
        setFront(selection ? `Vad är viktigt att minnas här?\n${selection.slice(0, 240)}` : '');
        setBack('');
        setFrontMath('');
        setBackMath('');
        setDrafts([]);
        setMode('add');
    };

    const openReview = () => {
        startTransition(async () => {
            const cards = await getDueFlashcards(12);
            setReviewCards(cards);
            setActiveReviewIndex(0);
            setIsAnswerVisible(false);
            setMode('review');
        });
    };

    const saveCard = () => {
        if (!front.trim() || !back.trim()) return;
        startTransition(async () => {
            await createFlashcard({
                deckName: context.topicName ? `${context.topicName} flashcards` : undefined,
                topicId: context.topicId ?? null,
                front,
                back,
                frontMath: frontMath || null,
                backMath: backMath || null,
                sourceContextType: context.sourceContextType,
                sourceContextId: context.sourceContextId ?? null,
            });
            setNotice('+5 XP - kort sparat');
            setMode('closed');
            refreshDashboard();
        });
    };

    const generateDrafts = () => {
        const snippet = context.snippet || front || selectedText;
        if (!snippet.trim() && !context.topicName) return;
        startTransition(async () => {
            const next = await draftFlashcardsFromContext({
                snippet,
                topicName: context.topicName ?? undefined,
                contextType: context.sourceContextType,
                maxDrafts: 3,
            });
            setDrafts(next);
            if (next[0]) {
                const form = draftToForm(next[0]);
                setFront(form.front);
                setBack(form.back);
                setFrontMath(form.frontMath);
                setBackMath(form.backMath);
            }
        });
    };

    const rateCard = (rating: Rating) => {
        if (!activeCard) return;
        startTransition(async () => {
            const result = await reviewFlashcard(activeCard.id, rating);
            setNotice(`+${result.xpAwarded} XP - ${ratingLabels[rating]}`);
            const nextCards = reviewCards.filter((card) => card.id !== activeCard.id);
            setReviewCards(nextCards);
            setActiveReviewIndex((index) => Math.min(index, Math.max(0, nextCards.length - 1)));
            setIsAnswerVisible(false);
            if (nextCards.length === 0) {
                setMode('closed');
                refreshDashboard();
            }
        });
    };

    useEffect(() => {
        if (!notice) return;
        const timer = window.setTimeout(() => setNotice(null), 2600);
        return () => window.clearTimeout(timer);
    }, [notice]);

    const dueCount = dashboard?.stats.dueCards ?? 0;

    if (!hasLoadedDashboard || dashboard === null) {
        return null;
    }

    return (
        <>
            <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3">
                <AnimatePresence>
                    {notice && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-lg dark:border-emerald-500/30 dark:bg-zinc-900 dark:text-emerald-300"
                        >
                            <Zap className="h-4 w-4" />
                            {notice}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-2">
                    <button
                        onClick={openReview}
                        className="relative flex h-12 items-center gap-2 rounded-full border border-violet-200 bg-white px-4 text-sm font-bold text-violet-700 shadow-lg transition hover:-translate-y-0.5 dark:border-violet-500/30 dark:bg-zinc-900 dark:text-violet-300"
                    >
                        <Layers className="h-4 w-4" />
                        {dueCount > 0 ? `${dueCount} att repetera` : 'Repetera'}
                    </button>
                    <button
                        onClick={openAdd}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-950 text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                        aria-label="Skapa flashcard"
                    >
                        <Plus className="h-6 w-6" />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {mode !== 'closed' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black/25 backdrop-blur-sm"
                        onClick={() => setMode('closed')}
                    >
                        <motion.aside
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
                            className="ml-auto flex h-full w-full max-w-md flex-col bg-white text-zinc-950 shadow-2xl dark:bg-zinc-950 dark:text-white"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
                                        Flashcards
                                    </p>
                                    <h2 className="text-lg font-bold">
                                        {mode === 'add' ? 'Skapa kort snabbt' : 'Repetition'}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setMode('closed')}
                                    className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {mode === 'add' ? (
                                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                                        <div className="mb-1 flex items-center gap-2 font-bold">
                                            <BookOpen className="h-4 w-4" />
                                            Källa
                                        </div>
                                        <p className="line-clamp-3 text-xs leading-5">
                                            {context.snippet || 'Kortet sparas från den aktuella sidan.'}
                                        </p>
                                    </div>

                                    <button
                                        onClick={generateDrafts}
                                        disabled={isPending}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
                                    >
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                        Föreslå med AI
                                    </button>

                                    {drafts.length > 0 && (
                                        <div className="grid gap-2">
                                            {drafts.map((draft, index) => (
                                                <button
                                                    key={`${draft.front}-${index}`}
                                                    onClick={() => {
                                                        const form = draftToForm(draft);
                                                        setFront(form.front);
                                                        setBack(form.back);
                                                        setFrontMath(form.frontMath);
                                                        setBackMath(form.backMath);
                                                    }}
                                                    className="rounded-xl border border-zinc-200 p-3 text-left text-xs transition hover:border-violet-300 hover:bg-violet-50 dark:border-zinc-800 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/10"
                                                >
                                                    <span className="font-bold">{draft.front}</span>
                                                    <ChevronRight className="float-right h-4 w-4 text-zinc-400" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <label className="block">
                                        <span className="mb-1 block text-sm font-bold">Framsida</span>
                                        <textarea
                                            value={front}
                                            onChange={(event) => setFront(event.target.value)}
                                            className="min-h-28 w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none transition focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900"
                                            placeholder="Skriv en konkret fråga..."
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="mb-1 block text-sm font-bold">Baksida</span>
                                        <textarea
                                            value={back}
                                            onChange={(event) => setBack(event.target.value)}
                                            className="min-h-24 w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none transition focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900"
                                            placeholder="Skriv ett kort exakt svar..."
                                        />
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="block">
                                            <span className="mb-1 block text-xs font-bold">Framsida LaTeX</span>
                                            <input
                                                value={frontMath}
                                                onChange={(event) => setFrontMath(event.target.value)}
                                                className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-1 block text-xs font-bold">Baksida LaTeX</span>
                                            <input
                                                value={backMath}
                                                onChange={(event) => setBackMath(event.target.value)}
                                                className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900"
                                            />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-1 flex-col p-5">
                                    {!activeCard ? (
                                        <div className="flex flex-1 flex-col items-center justify-center text-center">
                                            <Star className="mb-3 h-10 w-10 text-emerald-500" />
                                            <h3 className="text-lg font-bold">Inget att repetera just nu</h3>
                                            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                                                Nya kort visas här när FSRS schemalägger dem.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-1 flex-col">
                                            <div className="mb-3 flex items-center justify-between text-xs font-bold text-zinc-500">
                                                <span>{activeReviewIndex + 1} / {reviewCards.length}</span>
                                                <span>{activeCard.bucketLabel}</span>
                                            </div>
                                            <motion.div
                                                key={`${activeCard.id}-${isAnswerVisible}`}
                                                initial={{ rotateY: -6, opacity: 0 }}
                                                animate={{ rotateY: 0, opacity: 1 }}
                                                className="flex min-h-72 flex-1 flex-col justify-center rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center shadow-inner dark:border-zinc-800 dark:bg-zinc-900"
                                            >
                                                <p className="whitespace-pre-wrap text-xl font-bold leading-8">
                                                    {isAnswerVisible ? activeCard.back : activeCard.front}
                                                </p>
                                                {(isAnswerVisible ? activeCard.backMath : activeCard.frontMath) && (
                                                    <div className="mt-5 text-lg">
                                                        <InlineMath math={(isAnswerVisible ? activeCard.backMath : activeCard.frontMath) ?? ''} />
                                                    </div>
                                                )}
                                            </motion.div>
                                            {!isAnswerVisible ? (
                                                <button
                                                    onClick={() => setIsAnswerVisible(true)}
                                                    className="mt-5 rounded-xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                                                >
                                                    Visa svar
                                                </button>
                                            ) : (
                                                <div className="mt-5 grid grid-cols-4 gap-2">
                                                    {([1, 2, 3, 4] as Rating[]).map((rating) => (
                                                        <button
                                                            key={rating}
                                                            onClick={() => rateCard(rating)}
                                                            disabled={isPending}
                                                            className="rounded-xl border border-zinc-200 px-2 py-3 text-xs font-bold transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-zinc-800 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10"
                                                        >
                                                            {ratingLabels[rating]}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {mode === 'add' && (
                                <div className="border-t border-zinc-200 p-5 dark:border-zinc-800">
                                    <button
                                        onClick={saveCard}
                                        disabled={isPending || !front.trim() || !back.trim()}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        Spara kort
                                    </button>
                                </div>
                            )}
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
