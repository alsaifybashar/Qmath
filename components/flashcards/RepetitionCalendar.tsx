'use client';

/**
 * RepetitionCalendar — a 30-day dot grid that visualises how many cards are
 * scheduled to be reviewed each day. Implements design_principer.md's
 * "Spaced repetition-karta".
 *
 * Visual encoding:
 *   - empty day (0 due)  → faint outline
 *   - light load (1–4)   → small dot
 *   - heavy load (5+)    → larger dot, deeper colour
 *   - today              → ring around the cell
 *
 * Hover surfaces the absolute count.
 */

import React from 'react';
import { motion } from 'framer-motion';

interface RepetitionCalendarProps {
    /** Items are ISO-date keys (YYYY-MM-DD) → due count. Expected length 30. */
    upcomingByDay: { date: string; due: number }[];
}

const WEEKDAY_LABELS_SV = ['M', 'T', 'O', 'T', 'F', 'L', 'S']; // Mon-first

function weekdayIndexMondayFirst(d: Date): number {
    // JS getDay(): 0 Sun … 6 Sat. We want Mon=0 … Sun=6.
    return (d.getDay() + 6) % 7;
}

function ymd(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export default function RepetitionCalendar({ upcomingByDay }: RepetitionCalendarProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 30 days starting today, padded at the start so columns align by weekday.
    const startPadding = weekdayIndexMondayFirst(today);
    const cells: Array<{ date: Date | null; due: number; isToday: boolean }> = [];
    for (let i = 0; i < startPadding; i++) {
        cells.push({ date: null, due: 0, isToday: false });
    }
    for (let i = 0; i < 30; i++) {
        const date = new Date(today.getTime() + i * 86400000);
        const key = ymd(date);
        const due = upcomingByDay.find(b => b.date === key)?.due ?? 0;
        cells.push({ date, due, isToday: i === 0 });
    }

    const maxDue = Math.max(1, ...cells.map(c => c.due));

    return (
        <div>
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-white/45">
                {WEEKDAY_LABELS_SV.map((d, i) => (
                    <span key={i}>{d}</span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
                {cells.map((c, i) => {
                    if (!c.date) {
                        return <span key={`pad-${i}`} className="aspect-square" />;
                    }
                    const intensity = c.due === 0 ? 0 : Math.min(1, 0.25 + (c.due / maxDue) * 0.75);
                    const label = c.due === 0
                        ? `${c.date.toLocaleDateString('sv-SE')} · inga kort`
                        : `${c.date.toLocaleDateString('sv-SE')} · ${c.due} kort`;
                    return (
                        <motion.div
                            key={ymd(c.date)}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.01, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            title={label}
                            className={[
                                'relative aspect-square rounded-md flex items-center justify-center text-[10px] font-bold transition-colors',
                                c.due > 0
                                    ? 'text-white'
                                    : 'text-white/35',
                                c.isToday ? 'ring-2 ring-emerald-300' : '',
                            ].join(' ')}
                            style={{
                                background: c.due > 0
                                    ? `rgba(25, 100, 126, ${intensity})`
                                    : 'rgba(255,255,255,0.04)',
                                border: c.due > 0
                                    ? '1px solid rgba(167, 139, 250, 0.35)'
                                    : '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            <span className="leading-none">
                                {c.date.getDate()}
                            </span>
                            {c.due > 0 && (
                                <span className="absolute bottom-0.5 right-0.5 rounded-full bg-white/80 px-1 text-[8px] font-bold text-zinc-950">
                                    {c.due}
                                </span>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] text-white/45">
                <span>30 dagar framåt</span>
                <span className="inline-flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-sm bg-violet-500/30" /> låg
                    <span className="inline-block h-2 w-2 rounded-sm bg-violet-500/70" /> hög
                </span>
            </div>
        </div>
    );
}
