import Link from 'next/link';
import {
    BarChart3,
    BookOpen,
    Calendar,
    ChevronRight,
    Flame,
    Layers,
    Sparkles,
    TrendingUp,
    Zap,
} from 'lucide-react';
import { getFlashcardDashboard, FlashcardDeckSummary, FlashcardWithState } from '@/app/actions/flashcards';

function StatCard({
    icon,
    value,
    label,
    trend,
    isStreak,
}: {
    icon: React.ReactNode;
    value: string | number;
    label: string;
    trend?: string;
    isStreak?: boolean;
}) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/50 p-5 shadow-lg backdrop-blur-md transition-all hover:scale-[1.02] hover:bg-white/60 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/60">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary-500/10 blur-2xl transition-all group-hover:bg-primary-500/20" />
            <div className="relative z-10">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-zinc-800 ${isStreak ? 'animate-flame' : ''}`}>
                    {icon}
                </div>
                <div className="flex items-baseline gap-2">
                    <div className={`text-3xl font-black tracking-tight ${isStreak ? 'bg-gradient-to-br from-orange-500 to-rose-500 bg-clip-text text-transparent' : ''}`}>
                        {value}
                    </div>
                    {trend && (
                        <span className="text-xs font-bold text-emerald-500">{trend}</span>
                    )}
                </div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {label}
                </div>
            </div>
        </div>
    );
}

export default async function FlashcardsPage() {
    const dashboard = await getFlashcardDashboard();

    if (!dashboard) {
        return null;
    }

    const { decks, dueCards, recentCards, stats } = dashboard;
    const stabilityPct = stats.totalCards > 0
        ? Math.round((stats.longTermCards / stats.totalCards) * 100)
        : 0;

    return (
        <div className="relative mx-auto max-w-7xl px-4 py-10">
            {/* Ambient Background Orbs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="ambient-orb ambient-orb-1 opacity-20" />
                <div className="ambient-orb ambient-orb-2 opacity-10" />
            </div>

            <div className="relative z-10">
                <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div className="animate-slide-up">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="flex h-6 items-center rounded-full bg-primary-100 px-3 text-[10px] font-bold uppercase tracking-widest text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                                Adaptive Learning
                            </span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-white md:text-6xl">
                            Flash<span className="text-gradient">cards</span>
                        </h1>
                        <p className="mt-4 max-w-lg text-lg font-medium text-zinc-500 dark:text-zinc-400">
                            FSRS-driven repetition som maximerar ditt långtidsminne genom vetenskapligt optimerade intervall.
                        </p>
                    </div>
                    
                    <div className="animate-slide-up animation-delay-100">
                        <div className="group relative flex items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 backdrop-blur-sm transition-all hover:bg-emerald-500/10 dark:border-emerald-500/10">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Quick Tip</div>
                                <div className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                                    Markera text i artiklar för att skapa kort direkt.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-12 grid grid-cols-1 gap-5 animate-slide-up animation-delay-200 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<Layers className="h-5 w-5 text-blue-500" />}
                        value={stats.totalCards}
                        label="Samlade Kunskaper"
                    />
                    <StatCard
                        icon={<Calendar className="h-5 w-5 text-emerald-500" />}
                        value={stats.cardsReviewedToday}
                        label="Repeterade idag"
                        trend={stats.cardsReviewedToday > 0 ? '+XP' : undefined}
                    />
                    <StatCard
                        icon={<Flame className="h-6 w-6 text-orange-500" />}
                        value={stats.currentStreak}
                        label="Daglig Streak"
                        isStreak={stats.currentStreak > 0}
                    />
                    <StatCard
                        icon={<TrendingUp className="h-5 w-5 text-violet-500" />}
                        value={`${stabilityPct}%`}
                        label="Retentionsnivå"
                    />
                </div>

                <div className="mb-12 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
                    <section className="animate-slide-up animation-delay-300">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">Mina Kortlekar</h2>
                                <p className="text-sm font-medium text-zinc-500">Strukturera din inlärning per ämne.</p>
                            </div>
                            <button className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 dark:bg-white dark:text-zinc-900">
                                Ny Kortlek
                            </button>
                        </div>

                        {decks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 py-20 dark:border-zinc-800">
                                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-900">
                                    <Sparkles className="h-10 w-10 text-zinc-300" />
                                </div>
                                <h3 className="text-xl font-bold">Inga kort ännu</h3>
                                <p className="mt-2 max-w-xs text-center text-sm text-zinc-500">
                                    Börja bygga din personliga kunskapsbank genom att skapa ditt första kort.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {decks.map((deck: FlashcardDeckSummary) => {
                                    const duePct = deck.totalCards > 0
                                        ? Math.round((deck.dueCards / deck.totalCards) * 100)
                                        : 0;
                                    return (
                                        <div
                                            key={deck.id}
                                            className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-white p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl dark:bg-zinc-900/40"
                                        >
                                            <div className="mb-6 flex items-start justify-between">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
                                                    <BookOpen className="h-6 w-6" />
                                                </div>
                                                {deck.dueCards > 0 && (
                                                    <div className="animate-glow-pulse-accent flex items-center gap-1.5 rounded-full bg-violet-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                                                        <Zap className="h-3 w-3 fill-current" />
                                                        {deck.dueCards} Due
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <h3 className="mb-1 text-xl font-black leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                                {deck.name}
                                            </h3>
                                            <p className="mb-6 text-sm font-bold text-zinc-400">{deck.totalCards} KORT TOTALT</p>
                                            
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                                    <span>Progression</span>
                                                    <span>{100 - duePct}% Redo</span>
                                                </div>
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-violet-500 transition-all duration-1000"
                                                        style={{ width: `${100 - duePct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <aside className="animate-slide-up animation-delay-400">
                        <div className="mb-6">
                            <h2 className="text-2xl font-black tracking-tight">Dagens Pass</h2>
                            <p className="text-sm font-medium text-zinc-500">Schemalagt av FSRS-motorn.</p>
                        </div>

                        {dueCards.length > 0 ? (
                            <div className="space-y-4">
                                <Link
                                    href="/study/flashcards"
                                    className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-zinc-900 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-95 dark:bg-white dark:text-zinc-900"
                                >
                                    <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                    <span className="relative z-10 flex items-center gap-2">
                                        Börja Repetera ({dueCards.length})
                                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </span>
                                </Link>

                                <div className="rounded-3xl border border-zinc-200 bg-white/50 p-6 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/40">
                                    <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-400">Kommande Repetition</h3>
                                    <div className="space-y-3">
                                        {dueCards.slice(0, 5).map((card: FlashcardWithState) => (
                                            <div key={card.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-zinc-800">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[10px] font-black text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                                                    {card.state.reps}x
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-bold">{card.front}</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-tighter text-primary-500">{card.bucketLabel}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-3xl bg-emerald-500/5 p-8 text-center dark:bg-emerald-500/10">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <Zap className="h-8 w-8 fill-current" />
                                </div>
                                <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">Helt uppdaterad!</h3>
                                <p className="mt-2 text-sm font-medium text-emerald-800/60 dark:text-emerald-400/60">
                                    Bra jobbat! Du har inga fler kort att repetera just nu.
                                </p>
                            </div>
                        )}
                    </aside>
                </div>

                <section className="animate-slide-up animation-delay-500">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Senaste Korten</h2>
                            <p className="text-sm font-medium text-zinc-500">Dina senaste tillskott i kunskapsbanken.</p>
                        </div>
                        <Link href="/study" className="group flex items-center gap-1 text-sm font-black uppercase tracking-widest text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400">
                            Utforska mer
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                    
                    {recentCards.length === 0 ? (
                        <p className="text-sm font-medium text-zinc-500">Inga kort skapade ännu.</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {recentCards.map((card: FlashcardWithState) => (
                                <div 
                                    key={card.id} 
                                    className="group flex flex-col rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/40"
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                            {card.bucketLabel}
                                        </span>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                                            <Zap className="h-3 w-3" />
                                            {card.state.scheduledDays}d
                                        </div>
                                    </div>
                                    <p className="line-clamp-2 text-sm font-black leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                        {card.front}
                                    </p>
                                    <p className="mt-2 line-clamp-1 text-xs font-medium text-zinc-400">
                                        {card.back}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
