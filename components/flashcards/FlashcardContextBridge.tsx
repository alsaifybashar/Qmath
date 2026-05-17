'use client';

import { useEffect } from 'react';
import type { FlashcardSourceContextType } from '@/app/actions/flashcards';

interface FlashcardContextBridgeProps {
    sourceContextType: FlashcardSourceContextType;
    sourceContextId?: string | null;
    topicId?: string | null;
    topicName?: string | null;
    snippet?: string;
}

export function FlashcardContextBridge(props: FlashcardContextBridgeProps) {
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('qmath:flashcard-context', { detail: props }));
    }, [
        props.sourceContextType,
        props.sourceContextId,
        props.topicId,
        props.topicName,
        props.snippet,
    ]);

    return null;
}
