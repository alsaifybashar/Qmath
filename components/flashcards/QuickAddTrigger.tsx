'use client';

/**
 * QuickAddTrigger — header chip that opens the QuickAddOverlay.
 *
 * Reads the current pathname to infer source context (question, article,
 * manual) and forwards optional topic info from props so the new card is
 * associated with the right topic / source.
 */

import React, { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import QuickAddOverlay, { type QuickAddContext } from './QuickAddOverlay';
import type { FlashcardSourceContextType } from '@/app/actions/flashcards';

interface QuickAddTriggerProps {
    /** Plain-language topic for the AI prompt / overlay heading. */
    topicName?: string;
    /** Topic ID stored on the new card. */
    topicId?: string;
    /** Source-context ID (e.g. questionId or article slug). */
    sourceContextId?: string;
    /** Text to prefill the front field (typically the question stem). */
    prefillFront?: string;
    /** Force a specific contextType regardless of route detection. */
    overrideContextType?: FlashcardSourceContextType;
    /** Visual variant (currently only the header chip). */
    variant?: 'chip';
}

function detectContextFromPath(pathname: string | null): FlashcardSourceContextType {
    if (!pathname) return 'manual';
    if (pathname.startsWith('/study')) return 'question';
    if (pathname.startsWith('/question-view')) return 'question';
    if (pathname.startsWith('/articles')) return 'article';
    return 'manual';
}

export default function QuickAddTrigger({
    topicName,
    topicId,
    sourceContextId,
    prefillFront,
    overrideContextType,
    variant = 'chip',
}: QuickAddTriggerProps) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const context: QuickAddContext = useMemo(
        () => ({
            contextType: overrideContextType ?? detectContextFromPath(pathname),
            sourceContextId,
            topicId,
            topicName,
            prefillFront,
        }),
        [overrideContextType, pathname, sourceContextId, topicId, topicName, prefillFront],
    );

    if (variant === 'chip') {
        return (
            <>
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setOpen(true)}
                    aria-label="Skapa flashcard"
                    title="Skapa flashcard"
                    className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-violet-200/40 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 transition hover:bg-violet-100 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20"
                >
                    <Layers className="h-3 w-3" />
                    Flashcard
                </motion.button>
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setOpen(true)}
                    aria-label="Skapa flashcard"
                    title="Skapa flashcard"
                    className="lg:hidden p-2 text-zinc-400 hover:text-violet-600 dark:hover:text-violet-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <Layers className="h-5 w-5" />
                </motion.button>
                <QuickAddOverlay open={open} onClose={() => setOpen(false)} context={context} />
            </>
        );
    }

    // Fallback (kept for future variants — currently only 'chip')
    return null;
}
