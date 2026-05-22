'use client';

/**
 * Image occlusion editor.
 *
 * The user uploads (or pastes a URL of) an image; this editor lets them drag
 * rectangles over regions they want to hide, then emits an array of regions
 * in relative coordinates (0–1) so the masks scale correctly at display time.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, MousePointerSquareDashed } from 'lucide-react';
import type { OcclusionMask } from '@/app/actions/flashcards';

interface ImageOcclusionEditorProps {
    imageUrl: string;
    masks: OcclusionMask[];
    onChange: (masks: OcclusionMask[]) => void;
}

interface DragState {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
}

const MIN_REGION = 0.02; // 2% of image — anything smaller is ignored

export default function ImageOcclusionEditor({
    imageUrl,
    masks,
    onChange,
}: ImageOcclusionEditorProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [drag, setDrag] = useState<DragState | null>(null);

    const toRelative = useCallback((clientX: number, clientY: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return {
            x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
            y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
        };
    }, []);

    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if ((e.target as HTMLElement).dataset.maskHandle === 'true') return;
            const { x, y } = toRelative(e.clientX, e.clientY);
            setDrag({ startX: x, startY: y, currentX: x, currentY: y });
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        },
        [toRelative],
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!drag) return;
            const { x, y } = toRelative(e.clientX, e.clientY);
            setDrag(d => (d ? { ...d, currentX: x, currentY: y } : null));
        },
        [drag, toRelative],
    );

    const commitDrag = useCallback(() => {
        if (!drag) return;
        const x = Math.min(drag.startX, drag.currentX);
        const y = Math.min(drag.startY, drag.currentY);
        const w = Math.abs(drag.currentX - drag.startX);
        const h = Math.abs(drag.currentY - drag.startY);
        if (w >= MIN_REGION && h >= MIN_REGION) {
            onChange([...masks, { x, y, w, h }]);
        }
        setDrag(null);
    }, [drag, masks, onChange]);

    const onPointerUp = useCallback(() => {
        commitDrag();
    }, [commitDrag]);

    useEffect(() => {
        if (!drag) return;
        const handleCancel = () => commitDrag();
        window.addEventListener('pointercancel', handleCancel);
        return () => window.removeEventListener('pointercancel', handleCancel);
    }, [drag, commitDrag]);

    const removeMask = (idx: number) => {
        const next = masks.slice();
        next.splice(idx, 1);
        onChange(next);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-white/55">
                <MousePointerSquareDashed className="h-3.5 w-3.5" />
                Dra över de delar du vill dölja. Klicka på en region för att ta bort.
            </div>

            <div
                ref={containerRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="relative w-full select-none rounded-lg border border-white/15 bg-black/30 overflow-hidden touch-none"
                style={{ cursor: 'crosshair' }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imageUrl}
                    alt="Flashcard underlag"
                    draggable={false}
                    className="block w-full h-auto pointer-events-none"
                />

                {/* Committed masks */}
                {masks.map((m, i) => (
                    <button
                        key={`${m.x}-${m.y}-${m.w}-${m.h}-${i}`}
                        type="button"
                        data-mask-handle="true"
                        onClick={() => removeMask(i)}
                        title="Klicka för att ta bort"
                        className="absolute rounded-md bg-zinc-900/85 hover:bg-rose-500/40 ring-1 ring-white/10 backdrop-blur-sm transition-colors"
                        style={{
                            left: `${m.x * 100}%`,
                            top: `${m.y * 100}%`,
                            width: `${m.w * 100}%`,
                            height: `${m.h * 100}%`,
                        }}
                    >
                        <span className="sr-only">Ta bort region {i + 1}</span>
                        <Trash2
                            data-mask-handle="true"
                            className="absolute right-1 top-1 h-3 w-3 text-white/70"
                        />
                    </button>
                ))}

                {/* Live preview while dragging */}
                <AnimatePresence>
                    {drag && (() => {
                        const left = Math.min(drag.startX, drag.currentX);
                        const top = Math.min(drag.startY, drag.currentY);
                        const w = Math.abs(drag.currentX - drag.startX);
                        const h = Math.abs(drag.currentY - drag.startY);
                        return (
                            <motion.div
                                key="drag-preview"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute rounded-md bg-violet-500/35 ring-2 ring-violet-300/80"
                                style={{
                                    left: `${left * 100}%`,
                                    top: `${top * 100}%`,
                                    width: `${w * 100}%`,
                                    height: `${h * 100}%`,
                                }}
                            />
                        );
                    })()}
                </AnimatePresence>
            </div>

            {masks.length > 0 && (
                <div className="text-[11px] text-white/55">
                    {masks.length} dolda region{masks.length === 1 ? '' : 'er'}
                </div>
            )}
        </div>
    );
}
