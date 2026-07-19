'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { motionDuration, motionEase, shellSpring } from '@/lib/motion';

const PARTICLE_COUNT = 16;
const COLORS = [
    'bg-emerald-400',
    'bg-sky-400',
    'bg-violet-400',
    'bg-amber-400',
    'bg-rose-400',
    'bg-teal-400',
];

function ConfettiParticle({ delay, colorIndex, x, yExtra }: { delay: number; colorIndex: number; x: number; yExtra: number }) {
    return (
        <motion.div
            className={`absolute w-2 h-2 ${COLORS[colorIndex % COLORS.length]} rounded-full`}
            initial={{ y: 0, x: 0, opacity: 1, scale: 0.96 }}
            animate={{
                y: -140 - yExtra,
                x,
                opacity: 0,
                scale: 1,
                rotate: 360,
            }}
            transition={{ duration: 1.4, delay, ease: motionEase.out }}
        />
    );
}

interface MilestoneCelebrationProps {
    trigger: boolean;
    message?: string;
    onDone?: () => void;
    /** Hold time before clearing (ms). Default 1800. */
    durationMs?: number;
}

export default function MilestoneCelebration({
    trigger,
    message,
    onDone,
    durationMs = 1800,
}: MilestoneCelebrationProps) {
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (!trigger) return;
        if (reduceMotion) {
            onDone?.();
            return;
        }
        const t = setTimeout(() => {
            onDone?.();
        }, durationMs);
        return () => clearTimeout(t);
    }, [trigger, durationMs, onDone, reduceMotion]);

    if (reduceMotion) return null;

    return (
        <AnimatePresence>
            {trigger && (
                <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: motionDuration.slow, ease: motionEase.out }}
                >
                    {/* Confetti burst */}
                    <div className="relative">
                        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
                            const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
                            const distance = 120 + (i % 4) * 30;
                            return (
                                <ConfettiParticle
                                    key={i}
                                    delay={i * 0.04}
                                    colorIndex={i}
                                    x={Math.cos(angle) * distance}
                                    yExtra={Math.abs(Math.sin(angle)) * 60}
                                />
                            );
                        })}
                    </div>

                    {/* Central message bubble */}
                    {message && (
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={shellSpring}
                            className="relative bg-white/85 dark:bg-zinc-950/85 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-full px-5 py-2.5 shadow-elevation-3 flex items-center gap-2"
                        >
                            <Sparkles size={18} className="text-amber-500" />
                            <span className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-accent-600 dark:from-primary-300 dark:to-accent-300">
                                {message}
                            </span>
                        </motion.div>
                    )}

                    {/* Pulse ring */}
                    <span className="absolute w-32 h-32 rounded-full bg-primary-400/20 animate-pulse-ring" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
