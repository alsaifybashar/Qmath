'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { MasteryStage, STAGE_LABELS, STAGE_ORDER } from '@/types/analytics';

interface ProgressionRingProps {
    /** 0–100 percentage */
    value: number;
    stage: MasteryStage;
    label?: string;
    sublabel?: string;
    size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
    sm: { ring: 96, stroke: 8, dot: 7, font: 'text-lg', sublabel: 'text-[10px]' },
    md: { ring: 144, stroke: 10, dot: 9, font: 'text-2xl', sublabel: 'text-xs' },
    lg: { ring: 220, stroke: 14, dot: 12, font: 'text-5xl', sublabel: 'text-sm' },
};

export default function ProgressionRing({
    value,
    stage,
    label,
    sublabel,
    size = 'md',
}: ProgressionRingProps) {
    const dims = SIZE_MAP[size];
    const radius = (dims.ring - dims.stroke) / 2;
    const cx = dims.ring / 2;
    const cy = dims.ring / 2;
    const circumference = 2 * Math.PI * radius;
    const target = Math.max(0, Math.min(100, value));
    const stageIndex = STAGE_ORDER.indexOf(stage);

    const gradientId = useId();
    const glowId = useId();

    // 4 stage dots positioned at 25/50/75/100% around the ring (starting at top, going clockwise)
    const dots = STAGE_ORDER.map((s, i) => {
        const angle = -Math.PI / 2 + ((i + 1) / 4) * 2 * Math.PI;
        return {
            stage: s,
            cx: cx + radius * Math.cos(angle),
            cy: cy + radius * Math.sin(angle),
            reached: i <= stageIndex,
            active: i === stageIndex,
        };
    });

    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative" style={{ width: dims.ring, height: dims.ring }}>
                <svg
                    width={dims.ring}
                    height={dims.ring}
                    viewBox={`0 0 ${dims.ring} ${dims.ring}`}
                    className="-rotate-90"
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--primary-500)" />
                            <stop offset="100%" stopColor="var(--accent-500)" />
                        </linearGradient>
                        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Background track */}
                    <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={dims.stroke}
                        className="text-zinc-200/70 dark:text-zinc-800/70"
                    />

                    {/* Progress arc */}
                    <motion.circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill="none"
                        stroke={`url(#${gradientId})`}
                        strokeWidth={dims.stroke}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{
                            strokeDashoffset: circumference * (1 - target / 100),
                        }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        filter={`url(#${glowId})`}
                    />

                    {/* Stage dots */}
                    {dots.map((d, i) => (
                        <motion.circle
                            key={d.stage}
                            cx={d.cx}
                            cy={d.cy}
                            r={dims.dot}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                                delay: 0.4 + i * 0.12,
                                type: 'spring',
                                damping: 14,
                                stiffness: 260,
                            }}
                            className={
                                d.reached
                                    ? 'fill-white dark:fill-zinc-900 stroke-[var(--accent-500)]'
                                    : 'fill-zinc-100 dark:fill-zinc-900 stroke-zinc-300 dark:stroke-zinc-700'
                            }
                            strokeWidth={2.5}
                        />
                    ))}
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                        className={`font-bold tabular-nums bg-clip-text text-transparent bg-gradient-to-br from-primary-600 to-accent-600 dark:from-primary-400 dark:to-accent-400 ${dims.font}`}
                    >
                        {Math.round(target)}%
                    </motion.div>
                    {(label || sublabel) && (
                        <div className={`${dims.sublabel} text-zinc-500 dark:text-zinc-400 mt-0.5 text-center px-2 leading-tight`}>
                            {label && <div className="font-medium text-zinc-700 dark:text-zinc-300">{label}</div>}
                            {sublabel && <div>{sublabel}</div>}
                        </div>
                    )}
                </div>
            </div>

            {/* Stage labels under ring */}
            {size !== 'sm' && (
                <div className="flex items-center gap-1.5 mt-1">
                    {STAGE_ORDER.map((s, i) => (
                        <React.Fragment key={s}>
                            <span
                                className={[
                                    'text-[10px] font-medium tracking-wide uppercase transition-colors',
                                    i <= stageIndex
                                        ? 'text-primary-600 dark:text-primary-400'
                                        : 'text-zinc-400 dark:text-zinc-600',
                                ].join(' ')}
                            >
                                {STAGE_LABELS[s]}
                            </span>
                            {i < STAGE_ORDER.length - 1 && (
                                <span className="text-zinc-300 dark:text-zinc-700 text-[10px]">›</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
}
