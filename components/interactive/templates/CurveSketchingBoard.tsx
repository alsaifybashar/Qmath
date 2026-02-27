import React from 'react';
import JSXGraphBoard from '../JSXGraphBoard';

export function CurveSketchingBoard() {
    const initBoard = (JXG: any, boardId: string) => {
        // We will create two boards horizontally or vertically stacked.
        // For simplicity in the Next.js wrapper, we will do one large bounding box and draw separated axes.
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-5, 12, 5, -12],
            showCopyright: false,
            axis: false,
        });

        // Top Axis (f(x))
        board.create('axis', [[0, 6], [1, 6]]);
        board.create('axis', [[0, 0], [0, 1]]); // Y axis common somewhat

        // Bottom Axis (f'(x) and f''(x))
        board.create('axis', [[0, -6], [1, -6]]);

        // Base function: Cubic polynomial
        // Let's use roots at -2, 0, 2 -> x(x+2)(x-2) = x^3 - 4x
        // We scale it and shift it for visual separation

        // P1, P2, P3 control points for a smooth spline or bezier, but let's use gliders to define a cubic
        const a = board.create('slider', [[-4, 10], [-2, 10], [-1, 0.5, 1]], { name: 'a' });

        const f = (x: number) => a.Value() * (Math.pow(x, 3) - 4 * x) + 6; // +6 shifts to top graph
        const fPrime = (x: number) => a.Value() * (3 * Math.pow(x, 2) - 4) - 6; // -6 shifts to bottom graph
        const fDoublePrime = (x: number) => a.Value() * (6 * x) - 6;

        // Top graph f(x)
        board.create('functiongraph', [f], { strokeColor: '#3b82f6', strokeWidth: 3 });
        board.create('text', [3, 10, "f(x)"], { strokeColor: '#3b82f6', fontSize: 16 });

        // Bottom graph f'(x)
        board.create('functiongraph', [fPrime], { strokeColor: '#10b981', strokeWidth: 2 });
        board.create('text', [3, -2, "f'(x)"], { strokeColor: '#10b981', fontSize: 16 });

        // Bottom graph f''(x)
        board.create('functiongraph', [fDoublePrime], { strokeColor: '#f59e0b', strokeWidth: 2, dash: 2 });
        board.create('text', [3, -4, "f''(x)"], { strokeColor: '#f59e0b', fontSize: 16 });

        // Vertical tracker line
        const ptScanner = board.create('glider', [0, 6, board.create('line', [[-5, 6], [5, 6]], { visible: false })], { name: 'x', size: 5, fillColor: '#ef4444' });
        board.create('line', [[() => ptScanner.X(), 12], [() => ptScanner.X(), -12]], { strokeColor: '#ef4444', strokeWidth: 1, dash: 1 });

        // Intersections highlighting
        const ptTop = board.create('point', [() => ptScanner.X(), () => f(ptScanner.X())], { size: 3, fillColor: '#3b82f6', name: '' });
        const ptBottom1 = board.create('point', [() => ptScanner.X(), () => fPrime(ptScanner.X())], { size: 3, fillColor: '#10b981', name: '' });

        return board;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <span className="text-slate-300">Curve Scanner:</span>
                <span className="text-blue-400 font-mono text-sm">Drag the red point to scan zero-crossings</span>
            </div>
            <JSXGraphBoard initBoard={initBoard} className="w-full aspect-square min-h-[600px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl relative overflow-hidden" />
        </div>
    );
}
