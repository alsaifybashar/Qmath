import { useState, useCallback, useRef } from 'react';
import type { BoardStateSnapshot } from '@/types/jsxgraph-widgets';

interface UseBoardNarrationOptions {
    debounceMs?: number;
    provider?: 'anthropic' | 'ollama';
    onNarration?: (text: string) => void;
}

export function useBoardNarration({
    debounceMs = 1500,
    provider = 'ollama',
    onNarration,
}: UseBoardNarrationOptions = {}) {
    const [isNarrating, setIsNarrating] = useState(false);
    const [lastNarration, setLastNarration] = useState<string | null>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingState = useRef<BoardStateSnapshot | null>(null);
    const onNarrationRef = useRef(onNarration);
    // Keep ref current to avoid stale closure in the timer callback
    onNarrationRef.current = onNarration;

    const reportBoardState = useCallback((state: BoardStateSnapshot) => {
        pendingState.current = state;

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(async () => {
            if (!pendingState.current) return;

            setIsNarrating(true);
            try {
                const response = await fetch('/api/ai/board-narrate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        boardState: pendingState.current,
                        provider,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.narration) {
                        setLastNarration(data.narration);
                        onNarrationRef.current?.(data.narration);
                    }
                }
            } catch {
                // Narration is best-effort — silently fail
            } finally {
                setIsNarrating(false);
            }
        }, debounceMs);
    }, [debounceMs, provider]);

    return { reportBoardState, isNarrating, lastNarration };
}
