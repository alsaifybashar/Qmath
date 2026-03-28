'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface AIGraphProps {
    expression: string;
    title: string;
    x_range?: [number, number];
    y_range?: [number, number];
}

interface Range { min: number; max: number }

const POINTS = 300;
const ZOOM_FACTOR = 1.35;

function buildData(expression: string, min: number, max: number) {
    const safeExpr = expression
        .replace(/x\^(\d+)/g, 'Math.pow(x, $1)')
        .replace(/(\d+)x/g, '$1 * x')
        .replace(/\bsin\b/g, 'Math.sin')
        .replace(/\bcos\b/g, 'Math.cos')
        .replace(/\btan\b/g, 'Math.tan')
        .replace(/\bexp\b/g, 'Math.exp')
        .replace(/\bln\b/g, 'Math.log')
        .replace(/\blog\b/g, 'Math.log')
        .replace(/\bsqrt\b/g, 'Math.sqrt')
        .replace(/\babs\b/g, 'Math.abs')
        .replace(/\^/g, '**');

    try {
        const fn = new Function('x', `return ${safeExpr};`);
        const step = (max - min) / POINTS;
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i <= POINTS; i++) {
            const x = min + i * step;
            const y = fn(x);
            if (Number.isFinite(y)) pts.push({ x: +x.toFixed(5), y: +y.toFixed(5) });
        }
        return pts;
    } catch {
        return [];
    }
}

function fmtX(n: number) {
    const abs = Math.abs(n);
    if (abs >= 100) return n.toFixed(0);
    if (abs >= 10)  return n.toFixed(1);
    return n.toFixed(2);
}

export function AIGraph({ expression, title, x_range = [-10, 10], y_range }: AIGraphProps) {
    const defaultRange: Range = { min: x_range[0], max: x_range[1] };
    const [range, setRange] = useState<Range>(defaultRange);

    const data = useMemo(() => buildData(expression, range.min, range.max), [expression, range]);

    // ── zoom helpers ──────────────────────────────────────────────────────────
    const zoomAround = useCallback((cx: number, factor: number) => {
        setRange(r => {
            const newHalf = ((r.max - r.min) / 2) * factor;
            return { min: cx - newHalf, max: cx + newHalf };
        });
    }, []);

    const zoomIn  = useCallback(() => zoomAround((range.min + range.max) / 2, 1 / ZOOM_FACTOR), [range, zoomAround]);
    const zoomOut = useCallback(() => zoomAround((range.min + range.max) / 2, ZOOM_FACTOR),       [range, zoomAround]);
    const reset   = useCallback(() => setRange(defaultRange), [defaultRange.min, defaultRange.max]); // eslint-disable-line

    // ── scroll-wheel zoom (non-passive so we can preventDefault) ──────────────
    const containerRef = useRef<HTMLDivElement>(null);
    const plotAreaRef  = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = plotAreaRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            // Map cursor x-position to data x-value for zoom-towards-cursor
            const rect = el.getBoundingClientRect();
            // approximate: leave ~30px for Y-axis labels on the left
            const plotLeft  = rect.left + 30;
            const plotWidth = rect.width - 38; // subtract left + right margins
            const frac = Math.max(0, Math.min(1, (e.clientX - plotLeft) / plotWidth));
            setRange(r => {
                const span   = r.max - r.min;
                const cx     = r.min + frac * span;
                const factor = e.deltaY > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
                const newSpan = span * factor;
                return { min: cx - frac * newSpan, max: cx + (1 - frac) * newSpan };
            });
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    // ── drag-to-pan ───────────────────────────────────────────────────────────
    const dragState = useRef<{ startX: number; rangeAtStart: Range } | null>(null);

    const onPlotMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        dragState.current = { startX: e.clientX, rangeAtStart: range };
        e.currentTarget.setAttribute('data-dragging', 'true');
    }, [range]);

    const onPlotMouseMove = useCallback((e: React.MouseEvent) => {
        const ds = dragState.current;
        if (!ds || !plotAreaRef.current) return;
        const rect = plotAreaRef.current.getBoundingClientRect();
        const plotWidth = rect.width - 38;
        const span = ds.rangeAtStart.max - ds.rangeAtStart.min;
        const pxPerUnit = plotWidth / span;
        const delta = (ds.startX - e.clientX) / pxPerUnit;
        setRange({ min: ds.rangeAtStart.min + delta, max: ds.rangeAtStart.max + delta });
    }, []);

    const onPlotMouseUp = useCallback((e: React.MouseEvent) => {
        dragState.current = null;
        e.currentTarget.removeAttribute('data-dragging');
    }, []);

    // ── render ────────────────────────────────────────────────────────────────
    if (data.length === 0) {
        return (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
                <p className="text-xs text-zinc-500">Could not render graph for: {expression}</p>
            </div>
        );
    }

    const span = range.max - range.min;
    const isZoomed = Math.abs(span - (x_range[1] - x_range[0])) > 0.01
                  || Math.abs(range.min - x_range[0]) > 0.01;

    const btnCls = "flex items-center justify-center w-6 h-6 rounded-md transition-all duration-100 "
        + "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 "
        + "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 "
        + "border border-zinc-200 dark:border-zinc-700 active:scale-90";

    return (
        <div ref={containerRef} className="mt-2 rounded-xl border border-zinc-200 dark:border-zinc-700/60 overflow-hidden bg-white dark:bg-zinc-950 select-none">

            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 pt-2 pb-1.5 border-b border-zinc-100 dark:border-zinc-800/60">
                <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider truncate max-w-[150px]">
                    {title}
                </h5>
                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-zinc-400 font-mono mr-0.5 hidden sm:inline">
                        [{fmtX(range.min)}, {fmtX(range.max)}]
                    </span>
                    <button onClick={zoomIn}  className={btnCls} title="Zoom in  (or scroll up on chart)"><ZoomIn  className="w-3 h-3" /></button>
                    <button onClick={zoomOut} className={btnCls} title="Zoom out (or scroll down on chart)"><ZoomOut className="w-3 h-3" /></button>
                    {isZoomed && (
                        <button onClick={reset} className={btnCls + " text-violet-500 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-200"} title="Reset view">
                            <RotateCcw className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Hint strip */}
            <div className="px-3 py-1 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/40">
                <p className="text-[9px] text-zinc-400 text-center">Scroll to zoom · drag to pan</p>
            </div>

            {/* Chart — wheel + drag attached here */}
            <div
                ref={plotAreaRef}
                className="h-48 w-full px-1 pt-2 pb-1 cursor-grab active:cursor-grabbing"
                onMouseDown={onPlotMouseDown}
                onMouseMove={onPlotMouseMove}
                onMouseUp={onPlotMouseUp}
                onMouseLeave={onPlotMouseUp}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 4, right: 8, left: -22, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                        <ReferenceLine y={0} stroke="rgba(128,128,128,0.25)" strokeWidth={1} />
                        <ReferenceLine x={0} stroke="rgba(128,128,128,0.25)" strokeWidth={1} />
                        <XAxis
                            dataKey="x"
                            type="number"
                            domain={[range.min, range.max]}
                            allowDataOverflow
                            fontSize={9}
                            tick={{ fill: '#888' }}
                            axisLine={false}
                            tickLine={false}
                            tickCount={6}
                            tickFormatter={fmtX}
                        />
                        <YAxis
                            fontSize={9}
                            tick={{ fill: '#888' }}
                            axisLine={false}
                            tickLine={false}
                            domain={y_range || ['auto', 'auto']}
                            allowDataOverflow
                            tickCount={5}
                        />
                        <Tooltip
                            contentStyle={{
                                fontSize: '11px',
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                background: 'rgba(12,12,18,0.92)',
                                color: '#e2e8f0',
                                padding: '6px 10px',
                            }}
                            labelStyle={{ fontWeight: '600', color: '#a78bfa' }}
                            labelFormatter={(v) => `x = ${Number(v).toFixed(3)}`}
                            formatter={(v) => [typeof v === 'number' ? v.toFixed(4) : v, 'y']}
                            isAnimationActive={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="y"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Footer */}
            <div className="px-3 pb-2.5 pt-1 text-center border-t border-zinc-100 dark:border-zinc-800/40">
                <code className="text-[10px] py-0.5 px-2 bg-zinc-100 dark:bg-zinc-800 rounded text-violet-600 dark:text-violet-400">
                    y = {expression}
                </code>
            </div>
        </div>
    );
}
