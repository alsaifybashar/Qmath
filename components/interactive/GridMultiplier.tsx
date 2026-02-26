"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { cn } from './InteractiveWidgetWrapper';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface GridMultiplierProps {
    initialRows?: number;
    initialCols?: number;
    targetRows: number;
    targetCols: number;
    onSolve?: (solved: boolean) => void;
    readOnly?: boolean;
}

const DOT_SIZE = 40;
const GAP = 8;
const MAX_ROWS = 10;
const MAX_COLS = 10;

export function GridMultiplier({
    initialRows = 2,
    initialCols = 2,
    targetRows,
    targetCols,
    onSolve,
    readOnly = false
}: GridMultiplierProps) {
    const [rows, setRows] = useState(initialRows);
    const [cols, setCols] = useState(initialCols);
    const [isSolved, setIsSolved] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Check solve state
    useEffect(() => {
        if (rows === targetRows && cols === targetCols && !isSolved) {
            setIsSolved(true);
            if (onSolve) onSolve(true);
        } else if ((rows !== targetRows || cols !== targetCols) && isSolved) {
            setIsSolved(false);
            if (onSolve) onSolve(false);
        }
    }, [rows, cols, targetRows, targetCols, isSolved, onSolve]);

    const handleRowDragRaw = (y: number) => {
        if (readOnly || isSolved) return;
        const newRows = Math.max(1, Math.min(MAX_ROWS, Math.round(y / (DOT_SIZE + GAP))));
        if (newRows !== rows) setRows(newRows);
    };

    const handleColDragRaw = (x: number) => {
        if (readOnly || isSolved) return;
        const newCols = Math.max(1, Math.min(MAX_COLS, Math.round(x / (DOT_SIZE + GAP))));
        if (newCols !== cols) setCols(newCols);
    };

    const gridWidth = cols * (DOT_SIZE + GAP) - GAP;
    const gridHeight = rows * (DOT_SIZE + GAP) - GAP;

    return (
        <div className="flex flex-col items-center select-none">
            {/* Header Equation */}
            <motion.div
                animate={{
                    scale: isSolved ? [1, 1.1, 1] : 1,
                    color: isSolved ? '#06b6d4' : '#ffffff'
                }}
                transition={{ duration: 0.3 }}
                className="mb-8 font-mono text-3xl font-bold rounded-lg border border-slate-700 bg-slate-900/50 px-6 py-2 tracking-widest backdrop-blur-sm"
            >
                {cols} × {rows} = {cols * rows}
            </motion.div>

            {/* Grid Container */}
            <div
                ref={containerRef}
                className="relative"
                style={{
                    width: MAX_COLS * (DOT_SIZE + GAP),
                    height: MAX_ROWS * (DOT_SIZE + GAP)
                }}
            >
                {/* Transparent Base Grid outline (optional) */}

                {/* Bounding Box wrapper */}
                <motion.div
                    animate={{
                        width: gridWidth + DOT_SIZE,
                        height: gridHeight + DOT_SIZE
                    }}
                    transition={{ type: 'spring', bounce: 0.4, duration: 0.5 }}
                    className={cn(
                        "absolute top-0 left-0 border-2 rounded-xl flex flex-wrap content-start z-10 p-2 overflow-hidden",
                        isSolved ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.3)]" : "border-amber-200/50 bg-amber-900/10"
                    )}
                >
                    {Array.from({ length: rows * cols }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ delay: (i % cols) * 0.02 + Math.floor(i / cols) * 0.02 }}
                            className={cn(
                                "rounded-full m-1 shadow-inner",
                                isSolved ? "bg-cyan-400" : "bg-blue-400"
                            )}
                            style={{ width: DOT_SIZE - 8, height: DOT_SIZE - 8 }}
                        />
                    ))}
                </motion.div>

                {/* Column Dragger (Right) */}
                {!readOnly && !isSolved && (
                    <motion.div
                        drag="x"
                        dragConstraints={{ left: DOT_SIZE, right: MAX_COLS * (DOT_SIZE + GAP) }}
                        dragElastic={0}
                        dragMomentum={false}
                        onDrag={(e, info) => {
                            // Calculate relative to the container
                            if (containerRef.current) {
                                const rect = containerRef.current.getBoundingClientRect();
                                const x = info.point.x - rect.left;
                                handleColDragRaw(x);
                            }
                        }}
                        animate={{ x: gridWidth + DOT_SIZE }}
                        className="absolute top-0 bottom-0 w-8 -ml-4 flex items-center justify-center cursor-ew-resize z-20 group"
                        style={{ height: gridHeight + DOT_SIZE }}
                    >
                        <div className="w-2 h-full bg-white/20 rounded-full group-hover:bg-white/40 transition-colors" />
                    </motion.div>
                )}

                {/* Row Dragger (Bottom) */}
                {!readOnly && !isSolved && (
                    <motion.div
                        drag="y"
                        dragConstraints={{ top: DOT_SIZE, bottom: MAX_ROWS * (DOT_SIZE + GAP) }}
                        dragElastic={0}
                        dragMomentum={false}
                        onDrag={(e, info) => {
                            if (containerRef.current) {
                                const rect = containerRef.current.getBoundingClientRect();
                                const y = info.point.y - rect.top;
                                handleRowDragRaw(y);
                            }
                        }}
                        animate={{ y: gridHeight + DOT_SIZE }}
                        className="absolute left-0 right-0 h-8 -mt-4 flex items-center justify-center cursor-ns-resize z-20 group"
                        style={{ width: gridWidth + DOT_SIZE }}
                    >
                        <div className="h-2 w-full bg-white/20 rounded-full group-hover:bg-white/40 transition-colors" />
                    </motion.div>
                )}
            </div>

            {isSolved && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 flex items-center gap-2 text-cyan-400 font-semibold"
                >
                    <Sparkles className="w-5 h-5" />
                    <span>Brilliant! {targetCols} × {targetRows} = {targetRows * targetCols}</span>
                </motion.div>
            )}
        </div>
    );
}
