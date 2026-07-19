"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    ReferenceDot,
    ReferenceLine
} from 'recharts';
import { cn } from './InteractiveWidgetWrapper';
import { Target, TrendingUp } from 'lucide-react';
import { compileSafeExpression } from '@/lib/math/safe-expression';

interface CalculusTangentProps {
    expression: string; // e.g. "x^2"
    title?: string;
    domain?: [number, number];
}

export function CalculusTangent({ expression, title = "Derivative Visualization", domain = [-5, 5] }: CalculusTangentProps) {
    const [points, setPoints] = useState<any[]>([]);
    const [xVal, setXVal] = useState(1);

    const func = useMemo(() => {
        try {
            const compiled = compileSafeExpression(expression, { symbols: ['x'] });
            return (x: number) => {
                const value = compiled.evaluate({ x });
                return typeof value === 'number' && Number.isFinite(value) ? value : Number.NaN;
            };
        } catch {
            return () => Number.NaN;
        }
    }, [expression]);

    // Approximate derivative using central difference
    const dFunc = (x: number) => {
        const h = 0.0001;
        return (func(x + h) - func(x - h)) / (2 * h);
    };

    useMemo(() => {
        const data = [];
        const [min, max] = domain;
        const step = (max - min) / 50;
        for (let x = min; x <= max; x += step) {
            data.push({
                x: parseFloat(x.toFixed(2)),
                y: func(x)
            });
        }
        setPoints(data);
    }, [domain, func]);

    // Current point
    const yVal = func(xVal);
    const slope = dFunc(xVal);

    // Tangent points
    const tangentStart = {
        x: domain[0],
        y: yVal + slope * (domain[0] - xVal)
    };
    const tangentEnd = {
        x: domain[1],
        y: yVal + slope * (domain[1] - xVal)
    };

    // Build tangent data by replacing the main line points for the tangent scope, though Recharts ReferenceLine is easier.
    // However ReferenceLine requires exact intercept/slope props not easily supported in simple LineChart. 
    // Let's explicitly draw it by mapping two domain ends:
    const tangentData = [
        { x: domain[0], tangent: tangentStart.y },
        { x: domain[1], tangent: tangentEnd.y }
    ];

    return (
        <div className="flex flex-col items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-2xl select-none">

            <div className="flex items-center justify-between w-full mb-6">
                <div className="flex items-center gap-2 text-violet-500 font-semibold">
                    <TrendingUp className="w-5 h-5" />
                    <span>{title}</span>
                </div>
                <div className="text-right text-sm font-mono text-slate-500 dark:text-slate-400">
                    f(x) = {expression}
                </div>
            </div>

            <div className="relative w-full h-64 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                        <XAxis dataKey="x" type="number" domain={domain} hide />
                        <YAxis type="number" domain={['auto', 'auto']} hide />

                        {/* the main function curve */}
                        <Line
                            data={points}
                            type="monotone"
                            dataKey="y"
                            stroke="#19647e"
                            strokeWidth={3}
                            dot={false}
                            isAnimationActive={false}
                        />

                        {/* Tangent line */}
                        <Line
                            data={tangentData}
                            type="linear"
                            dataKey="tangent"
                            stroke="#06b6d4"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            isAnimationActive={false}
                        />

                        {/* Tangent Point */}
                        <ReferenceDot
                            x={xVal}
                            y={yVal}
                            r={6}
                            fill="#06b6d4"
                            stroke="#fff"
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Slider Controls */}
            <div className="w-full mt-8 bg-slate-100 dark:bg-slate-800 rounded-xl p-4 flex flex-col items-center">
                <div className="flex justify-between w-full text-sm font-mono text-slate-600 dark:text-slate-300 mb-2">
                    <span>x = {xVal.toFixed(2)}</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold">Slope (f') = {slope.toFixed(2)}</span>
                </div>
                <input
                    type="range"
                    min={domain[0]}
                    max={domain[1]}
                    step="0.1"
                    value={xVal}
                    onChange={(e) => setXVal(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
            </div>
        </div>
    );
}
