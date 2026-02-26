'use client';

import { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface AIGraphProps {
    expression: string;
    title: string;
    x_range?: [number, number];
    y_range?: [number, number];
}

export function AIGraph({ expression, title, x_range = [-10, 10], y_range }: AIGraphProps) {
    const data = useMemo(() => {
        const points = [];
        const [min, max] = x_range;
        const step = (max - min) / 100;

        // Simple expression evaluator for common functions
        // Converts x^2 to Math.pow(x, 2), sin(x) to Math.sin(x), etc.
        const prepareExpression = (expr: string) => {
            return expr
                .replace(/x\^(\d+)/g, 'Math.pow(x, $1)')
                .replace(/(\d+)x/g, '$1 * x')
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/exp/g, 'Math.exp')
                .replace(/log/g, 'Math.log')
                .replace(/sqrt/g, 'Math.sqrt')
                .replace(/\^/g, '**'); // fallback for x^y
        };

        const safeExpr = prepareExpression(expression);

        try {
            const func = new Function('x', `return ${safeExpr};`);

            for (let x = min; x <= max; x += step) {
                const y = func(x);
                if (!isNaN(y) && isFinite(y)) {
                    points.push({
                        x: parseFloat(x.toFixed(2)),
                        y: parseFloat(y.toFixed(2))
                    });
                }
            }
        } catch (error) {
            console.error('Failed to parse expression for plotting:', error);
        }

        return points;
    }, [expression, x_range]);

    if (data.length === 0) {
        return (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
                <p className="text-xs text-zinc-500">Could not render graph for: {expression}</p>
            </div>
        );
    }

    return (
        <div className="mt-2 p-3 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-inner">
            <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                {title}
            </h5>
            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                            dataKey="x"
                            fontSize={10}
                            tick={{ fill: '#888' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            fontSize={10}
                            tick={{ fill: '#888' }}
                            axisLine={false}
                            tickLine={false}
                            domain={y_range || ['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{
                                fontSize: '10px',
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                            labelStyle={{ fontWeight: 'bold' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="y"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={false}
                            animationDuration={1000}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-2 text-center">
                <code className="text-[10px] py-0.5 px-2 bg-zinc-100 dark:bg-zinc-800 rounded text-violet-600 dark:text-violet-400">
                    y = {expression}
                </code>
            </div>
        </div>
    );
}
