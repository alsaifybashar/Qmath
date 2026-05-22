import type { ReactNode } from 'react';
import Link from 'next/link';
import {
    Activity,
    BookOpen,
    BrainCircuit,
    CalendarDays,
    ChevronRight,
    Flame,
    Layers,
    Play,
    Sparkles,
    Target,
    Trophy,
    Zap,
} from 'lucide-react';
import {
    getFlashcardDashboard,
    type FlashcardDeckSummary,
    type FlashcardWithState,
} from '@/app/actions/flashcards';
import RepetitionCalendar from '@/components/flashcards/RepetitionCalendar';
import { BUCKET_LABEL_SV, BUCKET_ORDER, type StateBucket } from '@/lib/flashcards/state-buckets';
import CreateCardButton from './CreateCardButton';

const BUCKET_STYLES: Record<StateBucket, {
    chip: string;
    bar: string;
    dot: string;
}> = {
    ny: {
        chip: 'border-sky-300/40 bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-200',
        bar: 'bg-sky-400',
        dot: 'bg-sky-400',
    },
    repetera_snart: {
        chip: 'border-amber-300/40 bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200',
        bar: 'bg-amber-400',
        dot: 'bg-amber-400',
    },
    stabil: {
        chip: 'border-emerald-300/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200',
        bar: 'bg-emerald-400',
        dot: 'bg-emerald-400',
    },
    langtidsminne: {
        chip: 'border-violet-300/40 bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200',
        bar: 'bg-violet-400',
        dot: 'bg-violet-400',
    },
};

function clampPct(value: number) {
    return Math.max(0, Math.min(100, value));
}

function MetricTile({
    icon,
    label,
    value,
    helper,
    tone,
}: {
    icon: ReactNode;
    label: string;
    value: string | number;
    helper: string;
    tone: 'blue' | 'emerald' | 'orange' | 'violet';
}) {
    const tones = {
        blue: 'bg-blue-400/10 text-blue-700 dark:text-blue-100',
        emerald: 'bg-emerald-400/10 text-emerald-700 dark:text-emerald-100',
        orange: 'bg-orange-400/10 text-orange-700 dark:text-orange-100',
        violet: 'bg-violet-400/10 text-violet-700 dark:text-violet-100',
    };

    return (
        <div className="group rounded-xl border border-black/10 bg-white/70 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.06]">
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
                {icon}
            </div>
            <div className="text-2xl font-bold tracking-normal">{value}</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {label}
            </div>
            <div className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                {helper}
            </div>
        </div>
    );
}

function BucketTrack({
    bucket,
    count,
    total,
}: {
    bucket: StateBucket;
    count: number;
    total: number;
}) {
    const pct = total > 0 ? clampPct(Math.round((count / total) * 100)) : 0;

    return (
        <div className="rounded-xl border border-black/10 bg-white/65 p-3 dark:border-white/10 dark:bg-white/[0.05]">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${BUCKET_STYLES[bucket].dot}`} />
                    <span className="text-xs font-bold">{BUCKET_LABEL_SV[bucket]}</span>
                </div>
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800">
                <div className={`h-full rounded-full ${BUCKET_STYLES[bucket].bar}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function DeckCard({ deck }: { deck: FlashcardDeckSummary }) {
    const duePct = deck.totalCards > 0 ? clampPct(Math.round((deck.dueCards / deck.totalCards) * 100)) : 0;
    const readyPct = 100 - duePct;

    return (
        <article className="group rounded-xl border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.06] dark:hover:border-emerald-400/50">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-400/10 text-blue-700 dark:text-blue-100">
                    <BookOpen className="h-5 w-5" />
                </div>
                {deck.dueCards > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg shadow-violet-500/20">
                        <Zap className="h-3 w-3" />
                        {deck.dueCards} redo
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-200">
                        <Target className="h-3 w-3" />
                        I fas
                    </span>
                )}
            </div>
            <h3 className="line-clamp-2 text-lg font-bold tracking-normal transition group-hover:text-emerald-700 dark:group-hover:text-emerald-200">
                {deck.name}
            </h3>
            <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {deck.totalCards} kort i leken
            </p>
            <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    <span>Minnesstabilitet</span>
                    <span>{readyPct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 transition-all duration-700"
                        style={{ width: `${readyPct}%` }}
                    />
                </div>
            </div>
        </article>
    );
}

function DueCardRow({ card }: { card: FlashcardWithState }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white/75 p-3 dark:border-white/10 dark:bg-white/[0.06]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-xs font-bold text-white dark:bg-white dark:text-zinc-950">
                {card.state.reps}x
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{card.front}</p>
                <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${BUCKET_STYLES[card.bucket].chip}`}>
                    {card.bucketLabel}
                </span>
            </div>
        </div>
    );
}

function RecentCard({ card }: { card: FlashcardWithState }) {
    return (
        <article className="rounded-xl border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.06]">
            <div className="mb-3 flex items-center justify-between gap-3">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${BUCKET_STYLES[card.bucket].chip}`}>
                    {card.bucketLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    <Zap className="h-3 w-3" />
                    {card.state.scheduledDays}d
                </span>
            </div>
            <p className="line-clamp-3 text-sm font-bold leading-6">{card.front}</p>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{card.back}</p>
        </article>
    );
}

export default async function FlashcardsPage() {
    const dashboard = await getFlashcardDashboard();

    if (!dashboard) {
        return null;
    }

    const { decks, dueCards, recentCards, stats, upcomingByDay, bucketCounts } = dashboard;
    const stabilityPct = stats.totalCards > 0
        ? clampPct(Math.round((stats.longTermCards / stats.totalCards) * 100))
        : 0;
    const reviewEnergy = stats.totalCards > 0
        ? clampPct(Math.round(((stats.totalCards - stats.dueCards) / stats.totalCards) * 100))
        : 0;
    const dailyXpEstimate = stats.cardsReviewedToday * 8;

    return (
        <div className="dashboard-command">
            <div className="dashboard-command-bg" />
            <div className="dashboard-command-sheen" />
            <div className="relative z-10 mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
                <header className="mb-6 overflow-hidden rounded-2xl border border-black/10 bg-white/80 shadow-xl shadow-blue-500/5 backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
                    <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
                        <div className="p-6 sm:p-7">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-100">
                                <BrainCircuit className="h-3.5 w-3.5" />
                                Minnescentral
                            </div>
                            <h1 className="max-w-3xl text-3xl font-bold tracking-normal sm:text-5xl">
                                Flashcards som följer hur ditt minne faktiskt fungerar
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300 sm:text-base">
                                Skapa kort från frågor och artiklar, repetera med FSRS och få små belöningar när kunskap flyttas från ny till långtidsminne.
                            </p>
                            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/flashcards/review"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-zinc-800 active:translate-y-0 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                                >
                                    <Play className="h-4 w-4" />
                                    Starta repetition
                                </Link>
                                <CreateCardButton variant="ghost" label="Skapa kort" />
                            </div>
                        </div>

                        <div className="border-t border-black/10 bg-zinc-950 p-6 text-white dark:border-white/10 lg:border-l lg:border-t-0">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-white/45">Dagens laddning</p>
                                    <p className="mt-1 text-3xl font-bold">+{dailyXpEstimate} XP</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-400/15 text-orange-200">
                                    <Flame className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-white/60">
                                        <span>Review energy</span>
                                        <span>{reviewEnergy}%</span>
                                    </div>
                                    <div className="h-3 overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-300"
                                            style={{ width: `${reviewEnergy}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="rounded-xl bg-white/10 p-3">
                                        <p className="text-xl font-bold">{stats.dueCards}</p>
                                        <p className="text-[10px] font-bold uppercase text-white/45">Redo nu</p>
                                    </div>
                                    <div className="rounded-xl bg-white/10 p-3">
                                        <p className="text-xl font-bold">{stats.currentStreak}</p>
                                        <p className="text-[10px] font-bold uppercase text-white/45">Streak</p>
                                    </div>
                                    <div className="rounded-xl bg-white/10 p-3">
                                        <p className="text-xl font-bold">{stabilityPct}%</p>
                                        <p className="text-[10px] font-bold uppercase text-white/45">Stabilt</p>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm font-semibold text-emerald-100">
                                    {stats.dueCards > 0
                                        ? `${stats.dueCards} kort väntar. Ett kort pass räcker för att hålla kurvan varm.`
                                        : 'Du är ikapp. Skapa nya kort från dagens material för nästa repetition.'}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricTile
                        icon={<Layers className="h-5 w-5" />}
                        label="Kunskapskort"
                        value={stats.totalCards}
                        helper="Allt du har fångat från Qmath."
                        tone="blue"
                    />
                    <MetricTile
                        icon={<CalendarDays className="h-5 w-5" />}
                        label="Idag"
                        value={stats.cardsReviewedToday}
                        helper="Korta repetitioner räknas direkt."
                        tone="emerald"
                    />
                    <MetricTile
                        icon={<Flame className="h-5 w-5" />}
                        label="Streak"
                        value={stats.currentStreak}
                        helper="Personligt momentum utan ranking."
                        tone="orange"
                    />
                    <MetricTile
                        icon={<Trophy className="h-5 w-5" />}
                        label="Långtidsminne"
                        value={`${stabilityPct}%`}
                        helper="Andel kort med hög stabilitet."
                        tone="violet"
                    />
                </section>

                <section className="mb-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-2xl border border-black/10 bg-white/75 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <div>
                                <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                    <Activity className="h-3.5 w-3.5" />
                                    Minnesfaser
                                </div>
                                <h2 className="text-xl font-bold tracking-normal">Från nytt till stabilt</h2>
                            </div>
                            <Sparkles className="h-5 w-5 text-violet-500" />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {BUCKET_ORDER.map((bucket) => (
                                <BucketTrack
                                    key={bucket}
                                    bucket={bucket}
                                    count={bucketCounts[bucket]}
                                    total={stats.totalCards}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-zinc-950 p-5 text-white shadow-xl dark:border-white/10">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-200/70">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    Spaced repetition-karta
                                </div>
                                <h2 className="text-xl font-bold tracking-normal">Nästa 30 dagar</h2>
                            </div>
                            <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-white/60">
                                FSRS
                            </span>
                        </div>
                        <RepetitionCalendar upcomingByDay={upcomingByDay} />
                    </div>
                </section>

                <section className="mb-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                    <div>
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="text-xl font-bold tracking-normal">Mina kortlekar</h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Organiserade efter ämne, kurs eller snabbfångst.</p>
                            </div>
                            <CreateCardButton label="Nytt kort" />
                        </div>

                        {decks.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-10 text-center dark:border-zinc-700 dark:bg-white/[0.04]">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-700 dark:text-emerald-100">
                                    <Sparkles className="h-7 w-7" />
                                </div>
                                <h3 className="text-lg font-bold">Bygg första minneskedjan</h3>
                                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                                    Markera en formel, ett misstag eller en definition och gör den till ett kort direkt.
                                </p>
                                <div className="mt-5">
                                    <CreateCardButton label="Skapa första kortet" />
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                                {decks.map((deck: FlashcardDeckSummary) => (
                                    <DeckCard key={deck.id} deck={deck} />
                                ))}
                            </div>
                        )}
                    </div>

                    <aside>
                        <div className="mb-3">
                            <h2 className="text-xl font-bold tracking-normal">Dagens pass</h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Börja här när något förfaller.</p>
                        </div>
                        {dueCards.length > 0 ? (
                            <div className="space-y-3">
                                <Link
                                    href="/flashcards/review"
                                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 active:translate-y-0"
                                >
                                    Repetera {dueCards.length} kort
                                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                </Link>
                                <div className="space-y-2">
                                    {dueCards.slice(0, 5).map((card: FlashcardWithState) => (
                                        <DueCardRow key={card.id} card={card} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-6 text-center text-emerald-900 dark:text-emerald-100">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-400/20">
                                    <Zap className="h-7 w-7" />
                                </div>
                                <h3 className="font-bold">Allt är repeterat</h3>
                                <p className="mt-2 text-sm leading-6 text-emerald-800/70 dark:text-emerald-100/65">
                                    Du har inga kort som förfaller just nu. Det här är exakt vad spaced repetition ska göra.
                                </p>
                            </div>
                        )}
                    </aside>
                </section>

                <section>
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-xl font-bold tracking-normal">Senaste korten</h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Nya kopplingar från dina frågor och artiklar.</p>
                        </div>
                        <Link
                            href="/study"
                            className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 transition hover:text-blue-900 dark:text-blue-200 dark:hover:text-white"
                        >
                            Fortsätt studera
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                    {recentCards.length === 0 ? (
                        <p className="rounded-xl border border-black/10 bg-white/60 p-4 text-sm text-zinc-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-400">
                            Inga kort skapade ännu.
                        </p>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {recentCards.slice(0, 8).map((card: FlashcardWithState) => (
                                <RecentCard key={card.id} card={card} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
