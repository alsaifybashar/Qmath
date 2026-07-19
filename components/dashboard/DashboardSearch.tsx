'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    BarChart2,
    BookOpen,
    FileText,
    FlaskConical,
    Home,
    Layers,
    Bell,
    Search,
    Settings,
    User,
    Archive,
} from 'lucide-react';

const SEARCH_ITEMS = [
    { href: '/dashboard', label: 'Översikt', group: 'Studier', keywords: 'dashboard hem start kontrollcenter', Icon: Home },
    { href: '/analytics', label: 'Analys', group: 'Studier', keywords: 'statistik utveckling läranalys progress', Icon: BarChart2 },
    { href: '/courses', label: 'Kurser', group: 'Studier', keywords: 'ämnen kursplan topics matte', Icon: BookOpen },
    { href: '/articles', label: 'Artiklar', group: 'Resurser', keywords: 'guider teori texter läsning', Icon: FileText },
    { href: '/flashcards', label: 'Flashcards', group: 'Studier', keywords: 'kort repetition minne review', Icon: Layers },
    { href: '/archive', label: 'Gamla tentor', group: 'Tentaplugg', keywords: 'arkiv gamla prov examen tentor', Icon: Archive },
    { href: '/exams', label: 'Tentor', group: 'Tentaplugg', keywords: 'prov examen tentor översikt', Icon: FileText },
    { href: '/exam-sim', label: 'Tentasimulator', group: 'Tentaplugg', keywords: 'simulering prov tid träna', Icon: FlaskConical },
    { href: '/notifications', label: 'Notiser', group: 'Konto', keywords: 'aviseringar meddelanden uppdateringar', Icon: Bell },
    { href: '/profile', label: 'Profil', group: 'Konto', keywords: 'konto användare nivå', Icon: User },
    { href: '/settings', label: 'Inställningar', group: 'Konto', keywords: 'preferenser tema konto', Icon: Settings },
] as const;

export default function DashboardSearch() {
    const router = useRouter();
    const pathname = usePathname();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const openSearch = useCallback(() => {
        setOpen(true);
        requestAnimationFrame(() => inputRef.current?.focus());
    }, []);

    const results = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return SEARCH_ITEMS;

        return SEARCH_ITEMS.filter((item) => {
            const haystack = `${item.label} ${item.group} ${item.keywords}`.toLowerCase();
            return haystack.includes(needle);
        });
    }, [query]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p';
            if (!isShortcut) return;

            event.preventDefault();
            openSearch();
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [openSearch]);

    function closeSearch() {
        setOpen(false);
        setQuery('');
        setActiveIndex(0);
    }

    function goTo(href: string) {
        closeSearch();
        router.push(href);
    }

    function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Escape') {
            closeSearch();
            inputRef.current?.blur();
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
            return;
        }

        if (event.key === 'Enter' && results[activeIndex]) {
            event.preventDefault();
            goTo(results[activeIndex].href);
        }
    }

    return (
        <>
            <div className="relative z-20 mx-auto w-full max-w-[1120px] px-4 pt-5 sm:px-6 lg:px-8">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <button
                        type="button"
                        onClick={openSearch}
                        aria-label="Sök i dashboard"
                        className="h-12 w-full rounded-xl bg-white pl-11 pr-24 text-left text-sm text-zinc-500 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-[box-shadow,color] duration-150 hover:text-zinc-700 focus:shadow-[0_0_0_1px_var(--accent-border),0_0_0_4px_var(--accent-muted)] dark:bg-[var(--surface)] dark:text-zinc-400 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)] dark:hover:text-zinc-200"
                    >
                        Sök sidor, kurser och verktyg
                    </button>
                    <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-black/10 bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 sm:block">
                        Ctrl P
                    </kbd>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[18vh]">
                    <button
                        type="button"
                        aria-label="Stäng sök"
                        className="absolute inset-0 animate-search-backdrop bg-white/40 backdrop-blur-md dark:bg-black/45"
                        onClick={closeSearch}
                    />
                    <div className="relative w-full max-w-2xl animate-search-panel overflow-hidden rounded-2xl bg-white/95 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:bg-zinc-950/95 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_24px_60px_rgba(0,0,0,0.44)]">
                        <div className="relative border-b border-black/10 dark:border-white/10">
                            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                            <input
                                ref={inputRef}
                                type="search"
                                value={query}
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setActiveIndex(0);
                                }}
                                onKeyDown={handleInputKeyDown}
                                placeholder="Sök sidor, kurser och verktyg"
                                aria-label="Sök i dashboard"
                                className="h-16 w-full bg-transparent pl-14 pr-24 text-base text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-white"
                            />
                            <kbd className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 rounded-md border border-black/10 bg-zinc-100 px-2 py-1 text-[11px] font-semibold text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                                Esc
                            </kbd>
                        </div>

                        <div className="max-h-[420px] overflow-y-auto p-2">
                            {results.length > 0 ? (
                                results.map((item, index) => {
                                    const active = index === activeIndex;
                                    const current = pathname === item.href;
                                    return (
                                        <button
                                            key={item.href}
                                            type="button"
                                            onMouseEnter={() => setActiveIndex(index)}
                                            onClick={() => goTo(item.href)}
                                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-[background-color,color] duration-150 ${
                                                active
                                                    ? 'bg-[var(--accent-muted)] text-[var(--accent-500)]'
                                                    : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-white/5'
                                            }`}
                                        >
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--accent-500)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] dark:bg-white/5 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                                                <item.Icon className="h-4 w-4" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold">{item.label}</span>
                                                <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{item.group}</span>
                                            </span>
                                            {current && (
                                                <span className="rounded-md bg-[var(--accent-muted)] px-2 py-1 text-[11px] font-semibold text-[var(--accent-500)]">
                                                    Nuvarande
                                                </span>
                                            )}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                                    Inga sidor matchar sökningen.
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between border-t border-black/10 px-4 py-3 text-[11px] font-medium text-zinc-400 dark:border-white/10">
                            <span>
                                Använd piltangenterna för att välja
                            </span>
                            <span>
                                Enter öppnar sidan
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
