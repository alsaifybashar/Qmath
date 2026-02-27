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
    const reactId = useId().replace(/:/g, ''); // Strip colons for DOM safety

    // Generate a unique and stable ID if none is provided to avoid collisions
    const uid = boardId || `jxg-${reactId}`;

    useEffect(() => {
        if (typeof window !== 'undefined' && !isInitialized.current) {
            const loadJXG = async () => {
                try {
                    // Import jsxgraph dynamically to avoid SSR issues
                    const module = await import('jsxgraph');
                    const JXG = module.default || module;

                    if (JXG.Options && JXG.Options.board) {
                        JXG.Options.board.showCopyright = false;
                        JXG.Options.board.showNavigation = false;
                    }

                    // Run the board initialization
                    initBoard(JXG, uid);
                    isInitialized.current = true;
                } catch (err) {
                    console.error("Error loading JSXGraph:", err);
                }
            };
            loadJXG();
        }
    }, [uid, initBoard]);

    return (
        <div className={className}>
            <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/jsxgraph/distrib/jsxgraph.css" />
            <div id={uid} className="jxgbox w-full h-full" style={{ width: '100%', height: '100%' }} />
        </div>
    );
}
