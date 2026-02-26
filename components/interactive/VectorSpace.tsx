"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from './InteractiveWidgetWrapper';
import { ArrowUpRight } from 'lucide-react';

interface VectorSpaceProps {
    title?: string;
    description?: string;
}

export function VectorSpace({ title = "Vector Addition (u + v)", description }: VectorSpaceProps) {
    // Vectors represented as [x, y] coordinates
    const [u, setU] = useState({ x: 4, y: 2 });
    const [v, setV] = useState({ x: 2, y: 5 });

    // Resultant vector
    const r = { x: u.x + v.x, y: u.y + v.y };

    const svgRef = useRef<SVGSVGElement>(null);
    const [dragging, setDragging] = useState<'u' | 'v' | null>(null);

    const gridSize = 10;
    const unitSize = 25; // pixels per unit
    const centerX = 50;  // grid offset
    const centerY = (gridSize * unitSize) + 50; // SVG coordinates measure Y downwards, so we flip it later.

    const toSvgCoords = (x: number, y: number) => {
        return {
            cx: centerX + (x * unitSize),
            cy: centerY - (y * unitSize) // Flip Y
        };
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragging || !svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        // Calculate new grid coordinates based on pointer position within the SVG
        const pointerX = e.clientX - rect.left;
        const pointerY = e.clientY - rect.top;

        // Convert raw pixels back to math grid coordinates
        let newX = Math.round((pointerX - centerX) / unitSize);
        let newY = Math.round((centerY - pointerY) / unitSize);

        // Clamp to grid
        newX = Math.max(0, Math.min(newX, gridSize));
        newY = Math.max(0, Math.min(newY, gridSize));

        if (dragging === 'u') setU({ x: newX, y: newY });
        else if (dragging === 'v') setV({ x: newX, y: newY });
    };

    const handlePointerUp = () => setDragging(null);

    // Vector styles
    const uColor = "#f43f5e"; // Rose
    const vColor = "#3b82f6"; // Blue
    const rColor = "#10b981"; // Emerald

    // Define arrowhead marker IDs
    const arrowU = "arrowU";
    const arrowV = "arrowV";
    const arrowR = "arrowR";

    return (
        <div className="flex flex-col items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-2xl select-none">

            <div className="flex items-center justify-between w-full mb-6">
                <div className="flex items-center gap-2 text-indigo-500 font-semibold">
                    <ArrowUpRight className="w-5 h-5" />
                    <span>{title}</span>
                </div>
                <div className="flex gap-4 font-mono text-sm font-bold">
                    <span style={{ color: uColor }}>u = [{u.x}, {u.y}]</span>
                    <span style={{ color: vColor }}>v = [{v.x}, {v.y}]</span>
                    <span style={{ color: rColor }}>u+v = [{r.x}, {r.y}]</span>
                </div>
            </div>

            <div
                className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden touch-none"
                style={{ width: centerX + (gridSize * unitSize) + 50, height: centerY + 50 }}
            >
                <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    <defs>
                        <marker id={arrowU} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L9,3 z" fill={uColor} />
                        </marker>
                        <marker id={arrowV} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L9,3 z" fill={vColor} />
                        </marker>
                        <marker id={arrowR} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L9,3 z" fill={rColor} />
                        </marker>
                    </defs>

                    {/* Grid lines */}
                    {Array.from({ length: gridSize + 1 }).map((_, i) => (
                        <g key={i}>
                            {/* Vertical */}
                            <line
                                x1={centerX + (i * unitSize)} y1={centerY}
                                x2={centerX + (i * unitSize)} y2={centerY - (gridSize * unitSize)}
                                stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1"
                            />
                            {/* Horizontal */}
                            <line
                                x1={centerX} y1={centerY - (i * unitSize)}
                                x2={centerX + (gridSize * unitSize)} y2={centerY - (i * unitSize)}
                                stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1"
                            />
                        </g> // Added closing tag here
                    ))}

                    {/* Axes */}
                    <line x1={centerX} y1={centerY} x2={centerX + (gridSize * unitSize) + 20} y2={centerY} stroke="currentColor" className="text-slate-400 dark:text-slate-600" strokeWidth="2" />
                    <line x1={centerX} y1={centerY + 20} x2={centerX} y2={centerY - (gridSize * unitSize) - 20} stroke="currentColor" className="text-slate-400 dark:text-slate-600" strokeWidth="2" />

                    {/* Parallelogram Guides */}
                    <motion.line
                        animate={{ x1: toSvgCoords(u.x, u.y).cx, y1: toSvgCoords(u.x, u.y).cy, x2: toSvgCoords(r.x, r.y).cx, y2: toSvgCoords(r.x, r.y).cy }}
                        stroke={vColor} strokeDasharray="4 4" strokeWidth="2" opacity={0.4}
                    />
                    <motion.line
                        animate={{ x1: toSvgCoords(v.x, v.y).cx, y1: toSvgCoords(v.x, v.y).cy, x2: toSvgCoords(r.x, r.y).cx, y2: toSvgCoords(r.x, r.y).cy }}
                        stroke={uColor} strokeDasharray="4 4" strokeWidth="2" opacity={0.4}
                    />

                    {/* Vector U */}
                    <motion.line
                        x1={toSvgCoords(0, 0).cx} y1={toSvgCoords(0, 0).cy}
                        animate={{ x2: toSvgCoords(u.x, u.y).cx, y2: toSvgCoords(u.x, u.y).cy }}
                        stroke={uColor} strokeWidth="3" markerEnd={`url(#${arrowU})`}
                    />
                    <motion.circle
                        animate={{ cx: toSvgCoords(u.x, u.y).cx, cy: toSvgCoords(u.x, u.y).cy }}
                        r="12" fill={uColor} fillOpacity={0.2} stroke={uColor} strokeWidth="2"
                        className="cursor-move"
                        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging('u'); }}
                    />

                    {/* Vector V */}
                    <motion.line
                        x1={toSvgCoords(0, 0).cx} y1={toSvgCoords(0, 0).cy}
                        animate={{ x2: toSvgCoords(v.x, v.y).cx, y2: toSvgCoords(v.x, v.y).cy }}
                        stroke={vColor} strokeWidth="3" markerEnd={`url(#${arrowV})`}
                    />
                    <motion.circle
                        animate={{ cx: toSvgCoords(v.x, v.y).cx, cy: toSvgCoords(v.x, v.y).cy }}
                        r="12" fill={vColor} fillOpacity={0.2} stroke={vColor} strokeWidth="2"
                        className="cursor-move"
                        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging('v'); }}
                    />

                    {/* Resultant Vector */}
                    <motion.line
                        x1={toSvgCoords(0, 0).cx} y1={toSvgCoords(0, 0).cy}
                        animate={{ x2: toSvgCoords(r.x, r.y).cx, y2: toSvgCoords(r.x, r.y).cy }}
                        stroke={rColor} strokeWidth="3" markerEnd={`url(#${arrowR})`}
                    />
                </svg>
            </div>
            {description && (
                <p className="mt-4 text-xs text-slate-500 text-center max-w-md">
                    {description}
                </p>
            )}
        </div>
    );
}
