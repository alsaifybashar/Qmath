'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Compass } from 'lucide-react';

export type Pace = 'ahead' | 'on-track' | 'behind';

const MESSAGES: Record<Pace, string[]> = {
    'ahead': [
        'Du är före planen',
        'Stark vecka — fortsätt så',
        'Du bygger momentum',
        'Stadigt steg framåt',
    ],
    'on-track': [
        'Du ligger i fas',
        'Stadig progression',
        'Allt enligt plan',
        'En lugn, säker takt',
    ],
    'behind': [
        'Liten justering räcker',
        'En kort session löser det',
        'Du har gjort detta förr',
        'Fokus på en sak i taget',
    ],
};

const PACE_META: Record<Pace, { label: string; tone: string; Icon: typeof Sparkles }> = {
    'ahead': {
        label: 'Före planen',
        tone: 'from-emerald-500/15 via-transparent to-primary-500/15 text-emerald-700 dark:text-emerald-300',
        Icon: TrendingUp,
    },
    'on-track': {
        label: 'I fas',
        tone: 'from-primary-500/15 via-transparent to-accent-500/15 text-primary-700 dark:text-primary-300',
        Icon: Sparkles,
    },
    'behind': {
        label: 'Liten lutning',
        tone: 'from-amber-500/15 via-transparent to-primary-500/10 text-amber-700 dark:text-amber-300',
        Icon: Compass,
    },
};

interface MotivationalCardProps {
    pace: Pace;
    name?: string;
    /** Cycle interval in ms. Default 6000. */
    intervalMs?: number;
}

export default function MotivationalCard({ pace, name, intervalMs = 6000 }: MotivationalCardProps) {
    const messages = MESSAGES[pace];
    const meta = PACE_META[pace];
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setIndex(i => (i + 1) % messages.length);
        }, intervalMs);
        return () => clearInterval(id);
    }, [messages.length, intervalMs]);

    const greeting = name ? `Hej ${name}` : 'Välkommen tillbaka';

    return (
        <div
            className={[
                'relative overflow-hidden rounded-2xl',
                'bg-gradient-to-br',
                meta.tone,
                'border border-white/60 dark:border-white/10',
                'backdrop-blur-xl px-5 py-4',
            ].join(' ')}
        >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-accent-500" />

            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                    <meta.Icon size={18} className="opacity-80" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold tracking-wide uppercase opacity-70">
                        {meta.label}
                    </div>
                    <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                        {greeting}
                    </div>
                    <div className="h-6 mt-1 relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute inset-0 text-sm text-zinc-700 dark:text-zinc-300"
                            >
                                {messages[index]}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
