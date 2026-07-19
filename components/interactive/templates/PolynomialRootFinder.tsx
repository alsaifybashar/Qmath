import React, { useState, useRef, useEffect } from 'react';
import JSXGraphBoard from '../JSXGraphBoard';
import type { PolynomialRootFinderProps } from '@/types/jsxgraph-widgets';

export function PolynomialRootFinder({
    initialRoot1 = -1,
    initialRoot2 = 1,
    onStateChange,
}: PolynomialRootFinderProps) {
    const [equation, setEquation] = useState(`y = (x + ${Math.abs(initialRoot1).toFixed(1)})(x - ${initialRoot2.toFixed(1)})`);
    const onStateChangeRef = useRef(onStateChange);
    useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

    const initBoard = (JXG: any, boardId: string) => {
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-5, 5, 5, -5],
            axis: true,
            showCopyright: false,
            showNavigation: false,
        });

        const r1 = board.create('glider', [initialRoot1, 0, board.defaultAxes.x], { name: 'r_1', size: 5, fillColor: '#3585a3', strokeColor: '#24718e' });
        const r2 = board.create('glider', [initialRoot2, 0, board.defaultAxes.x], { name: 'r_2', size: 5, fillColor: '#ef4444', strokeColor: '#dc2626' });

        board.create('functiongraph', [
            (x: number) => (x - r1.X()) * (x - r2.X())
        ], { strokeColor: '#10b981', strokeWidth: 3 });

        const updateEquation = () => {
            const val1 = r1.X() > 0 ? `- ${r1.X().toFixed(1)}` : `+ ${Math.abs(r1.X()).toFixed(1)}`;
            const val2 = r2.X() > 0 ? `- ${r2.X().toFixed(1)}` : `+ ${Math.abs(r2.X()).toFixed(1)}`;
            const eq = `y = (x ${val1})(x ${val2})`;
            setEquation(eq);
            onStateChangeRef.current?.({
                root1: parseFloat(r1.X().toFixed(2)),
                root2: parseFloat(r2.X().toFixed(2)),
                equation: eq,
            });
        };

        r1.on('drag', updateEquation);
        r2.on('drag', updateEquation);

        return board;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <span className="text-slate-300">Factored Form:</span>
                <span className="text-green-400 font-mono text-lg">{equation}</span>
            </div>
            <JSXGraphBoard initBoard={initBoard} />
        </div>
    );
}
