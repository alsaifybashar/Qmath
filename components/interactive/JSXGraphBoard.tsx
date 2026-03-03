'use client';

import React, { useEffect, useRef, useId } from 'react';

interface JSXGraphBoardProps {
    boardId?: string;
    initBoard: (JXG: any, boardId: string) => any;
    className?: string;
}

export default function JSXGraphBoard({
    boardId,
    initBoard,
    className = 'w-full aspect-square min-h-[400px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl relative overflow-hidden',
}: JSXGraphBoardProps) {
    const isInitialized = useRef(false);
    const boardRef = useRef<any>(null);
    const JXGRef = useRef<any>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    /**
     * Keep initBoard in a ref so the effect can always call the latest version
     * without needing it as a dependency (which would re-init the board every
     * time AIPanel's `messages` array grows).
     */
    const initBoardRef = useRef(initBoard);
    initBoardRef.current = initBoard;

    const reactId = useId().replace(/:/g, ''); // strip colons — invalid in DOM ids
    const uid = boardId || `jxg-${reactId}`;

    useEffect(() => {
        if (typeof window === 'undefined' || isInitialized.current) return;

        /**
         * React 18 Strict Mode double-invokes effects in development:
         *   mount → cleanup → mount
         * The async import means the board can be created AFTER the first
         * cleanup has already run. `cancelled` lets us detect that case and
         * abort / immediately free the just-created board.
         */
        let cancelled = false;

        const loadJXG = async () => {
            try {
                const module = await import('jsxgraph');
                if (cancelled) return; // cleanup already ran — bail out

                const JXG = module.default || module;
                JXGRef.current = JXG;

                if (JXG.Options?.board) {
                    JXG.Options.board.showCopyright = false;
                    JXG.Options.board.showNavigation = false;
                }

                /**
                 * IMPORTANT: JSXGraph registers boards under its own internal
                 * numeric id (e.g. "jxgBoard42"), NOT the DOM element's id.
                 * So we cannot look up a stale board via JXG.boards[uid].
                 * Instead we search by containerObj.id (which IS the DOM id).
                 */
                const staleBoard = Object.values(JXG.boards || {}).find(
                    (b: any) => b?.containerObj?.id === uid
                );
                if (staleBoard) {
                    try { JXG.JSXGraph.freeBoard(staleBoard); } catch (_) { /* ignore */ }
                }

                const board = initBoardRef.current(JXG, uid);

                // If cleanup fired while we were awaiting the import, free immediately
                if (cancelled) {
                    try { JXG.JSXGraph.freeBoard(board); } catch (_) { /* ignore */ }
                    return;
                }

                boardRef.current = board;
                isInitialized.current = true;

                // ── ResizeObserver ────────────────────────────────────────────────
                // JSXGraph captures the container size at init time. When the
                // widget transitions between split-screen (large) and inline chat
                // (smaller), or when CSS layout hasn't settled yet at mount time,
                // we call board.resizeContainer() so the coordinate system stays
                // correctly mapped to the new pixel dimensions.
                if (board && containerRef.current) {
                    resizeObserverRef.current = new ResizeObserver(() => {
                        const el = containerRef.current;
                        if (!el || !boardRef.current) return;
                        const w = el.clientWidth;
                        const h = el.clientHeight;
                        if (w > 0 && h > 0) {
                            try {
                                // dontSet=true → let CSS own the container size;
                                // JSXGraph only recalculates its internal unit scale.
                                boardRef.current.resizeContainer(w, h, true);
                                boardRef.current.fullUpdate();
                            } catch (_) { /* ignore */ }
                        }
                    });
                    resizeObserverRef.current.observe(containerRef.current);
                }
            } catch (err) {
                console.error('[JSXGraphBoard] Error loading JSXGraph:', err);
            }
        };

        loadJXG();

        // Cleanup: runs on unmount (e.g. widget moves split-screen ↔ inline chat)
        // and on the Strict Mode dev double-invoke.
        return () => {
            cancelled = true;

            resizeObserverRef.current?.disconnect();
            resizeObserverRef.current = null;

            if (boardRef.current && JXGRef.current) {
                try { JXGRef.current.JSXGraph.freeBoard(boardRef.current); } catch (_) { /* ignore */ }
                boardRef.current = null;
            }

            // Allow re-initialisation on the next mount.
            isInitialized.current = false;
        };

        // uid is stable per component-tree position; initBoard is accessed via ref.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid]);

    return (
        <div ref={containerRef} className={className}>
            <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraph.css" />
            <div id={uid} className="jxgbox w-full h-full" style={{ width: '100%', height: '100%' }} />
        </div>
    );
}
