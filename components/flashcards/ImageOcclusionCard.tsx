'use client';

/**
 * Display component for image-occlusion flashcards.
 *
 * Renders an image with dark rounded overlays positioned over the masked
 * regions. When `revealed` is true (or the user clicks the card) the
 * overlays fade out so the answer is visible.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye } from 'lucide-react';
import type { OcclusionMask } from '@/app/actions/flashcards';

interface ImageOcclusionCardProps {
    imageUrl: string;
    masks: OcclusionMask[];
    /** When true, force-reveal regardless of internal toggle. */
    revealed?: boolean;
    /** Fired when the user toggles reveal via click. */
    onRevealChange?: (revealed: boolean) => void;
    /** Optional caption shown above the image. */
    caption?: string;
}

export default function ImageOcclusionCard({
    imageUrl,
    masks,
    revealed: controlled,
    onRevealChange,
    caption,
}: ImageOcclusionCardProps) {
    const [internal, setInternal] = useState(false);
    const isControlled = typeof controlled === 'boolean';
    const revealed = isControlled ? controlled : internal;

    const toggle = () => {
        const next = !revealed;
        if (!isControlled) setInternal(next);
        onRevealChange?.(next);
    };

    return (
        <div className="space-y-2">
            {caption && (
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{caption}</p>
            )}

            <button
                type="button"
                onClick={toggle}
                className="group relative block w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                aria-pressed={revealed}
                aria-label={revealed ? 'Dölj svaret' : 'Visa svaret'}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imageUrl}
                    alt="Flashcard"
                    draggable={false}
                    className="block w-full h-auto select-none"
                />

                <AnimatePresence>
                    {!revealed &&
                        masks.map((m, i) => (
                            <motion.span
                                key={`mask-${i}`}
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                transition={{
                                    duration: 0.35,
                                    delay: i * 0.04,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                                className="pointer-events-none absolute rounded-md bg-zinc-900/92 ring-1 ring-white/10 backdrop-blur-sm"
                                style={{
                                    left: `${m.x * 100}%`,
                                    top: `${m.y * 100}%`,
                                    width: `${m.w * 100}%`,
                                    height: `${m.h * 100}%`,
                                }}
                            />
                        ))}
                </AnimatePresence>

                {!revealed && (
                    <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-zinc-900/80 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg backdrop-blur">
                        <Eye className="h-3 w-3" /> Tryck för att avslöja
                    </span>
                )}
            </button>
        </div>
    );
}
