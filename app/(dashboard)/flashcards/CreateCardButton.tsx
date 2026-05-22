'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import QuickAddOverlay from '@/components/flashcards/QuickAddOverlay';

interface CreateCardButtonProps {
    variant?: 'primary' | 'ghost';
    label?: string;
}

export default function CreateCardButton({
    variant = 'primary',
    label = 'Nytt kort',
}: CreateCardButtonProps) {
    const [open, setOpen] = useState(false);

    const className =
        variant === 'primary'
            ? 'inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 dark:bg-white dark:text-zinc-900'
            : 'inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-900 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white';

    return (
        <>
            <button type="button" className={className} onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                {label}
            </button>
            <QuickAddOverlay
                open={open}
                onClose={() => setOpen(false)}
                context={{ contextType: 'manual' }}
            />
        </>
    );
}
