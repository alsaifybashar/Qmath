'use client';

import React, { useEffect, useRef, useId, useState } from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';

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

    // Expose board instance to overlay buttons after init
    const [board, setBoard] = useState<any>(null);

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

                    // ── Enable scroll-wheel zoom and drag-to-pan globally ──────────────
                    // Individual templates call initBoard without zoom settings, so we
                    // set the defaults here before any board is created.
                    JXG.Options.board.zoom = {
                        enabled: true,
                        wheel: true,       // scroll wheel zooms the board
                        needShift: false,  // no modifier key required
                        min: 0.001,
                        max: 1000,
                        factorX: 1.25,
                        factorY: 1.25,
                        center: 'auto',
                    };
                    JXG.Options.board.pan = {
                        enabled: true,
                        needShift: false,  // drag on empty space pans
                        needTwoFingers: false,
                    };
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

                const createdBoard = initBoardRef.current(JXG, uid);

                // If cleanup fired while we were awaiting the import, free immediately
                if (cancelled) {
                    try { JXG.JSXGraph.freeBoard(createdBoard); } catch (_) { /* ignore */ }
                    return;
                }

                boardRef.current = createdBoard;
                isInitialized.current = true;
                setBoard(createdBoard); // triggers re-render so zoom buttons appear

                // ── ResizeObserver ────────────────────────────────────────────────
                if (createdBoard && containerRef.current) {
                    resizeObserverRef.current = new ResizeObserver(() => {
                        const el = containerRef.current;
                        if (!el || !boardRef.current) return;
                        const w = el.clientWidth;
                        const h = el.clientHeight;
                        if (w > 0 && h > 0) {
                            try {
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

        return () => {
            cancelled = true;

            resizeObserverRef.current?.disconnect();
            resizeObserverRef.current = null;

            if (boardRef.current && JXGRef.current) {
                try { JXGRef.current.JSXGraph.freeBoard(boardRef.current); } catch (_) { /* ignore */ }
                boardRef.current = null;
            }

            setBoard(null);
            isInitialized.current = false;
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid]);

    // ── Zoom helpers (called by overlay buttons) ──────────────────────────────
    const handleZoomIn  = () => { try { board?.zoomIn();  } catch (_) {} };
    const handleZoomOut = () => { try { board?.zoomOut(); } catch (_) {} };
    const handleReset   = () => { try { board?.zoom100(); } catch (_) {} };

    // ── Overlay button style ──────────────────────────────────────────────────
    const btnCls =
        'w-7 h-7 flex items-center justify-center rounded-lg ' +
        'bg-zinc-900/75 backdrop-blur-sm border border-white/10 ' +
        'text-zinc-400 hover:text-violet-300 hover:border-violet-500/40 hover:bg-zinc-800/90 ' +
        'transition-all duration-150 active:scale-90 shadow-md';

    return (
        // `group` enables hover-based opacity on child overlays
        <div ref={containerRef} className={`${className} group`} style={{ position: 'relative' }}>
            <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraph.css" />
            <div id={uid} className="jxgbox w-full h-full" style={{ width: '100%', height: '100%' }} />

            {/* ── Scroll hint — fades in on hover ─────────────────────────────── */}
            <div className="pointer-events-none select-none absolute top-2.5 left-1/2 -translate-x-1/2 z-20
                            px-2.5 py-1 rounded-full
                            bg-zinc-900/70 backdrop-blur-sm border border-white/10
                            text-[9px] font-medium text-zinc-400 whitespace-nowrap
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Scroll to zoom · drag to pan
            </div>

            {/* ── Zoom overlay buttons — always accessible, subtle at rest ────── */}
            {board && (
                <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5
                                opacity-40 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={handleZoomIn}  className={btnCls} title="Zoom in  (+)">
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={handleZoomOut} className={btnCls} title="Zoom out (-)">
                        <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={handleReset}   className={btnCls} title="Reset view">
                        <RotateCcw className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
}
