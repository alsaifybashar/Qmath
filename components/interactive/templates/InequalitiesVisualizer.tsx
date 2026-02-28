import React, { useState, useRef, useEffect } from 'react';
import JSXGraphBoard from '../JSXGraphBoard';
import type { InequalitiesVisualizerProps } from '@/types/jsxgraph-widgets';

export function InequalitiesVisualizer({
    initialSlope = 2,
    initialIntercept = 1,
    onStateChange,
}: InequalitiesVisualizerProps) {
    const [inequality, setInequality] = useState(`y > ${initialSlope}x + ${initialIntercept}`);
    const onStateChangeRef = useRef(onStateChange);
    useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

    const initBoard = (JXG: any, boardId: string) => {
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-5, 5, 5, -5],
            axis: true,
            showCopyright: false,
        });

        // Derive two points from initial slope and intercept
        const initP1x = -1;
        const initP1y = initialSlope * initP1x + initialIntercept;
        const initP2x = 1;
        const initP2y = initialSlope * initP2x + initialIntercept;
        const p1 = board.create('point', [initP1x, initP1y], { name: 'A', size: 4, fillColor: '#3b82f6', strokeColor: '#2563eb' });
        const p2 = board.create('point', [initP2x, initP2y], { name: 'B', size: 4, fillColor: '#3b82f6', strokeColor: '#2563eb' });

        const line = board.create('line', [p1, p2], { strokeColor: '#3b82f6', strokeWidth: 2, dash: 2 }); // dashed for strictly greater/less

        // Inequality region (y > mx + b)
        // JXG.Inequality takes a line/curve. E.g., board.create('inequality', [line])
        const ineq = board.create('inequality', [line], { fillColor: '#3b82f6', fillOpacity: 0.2 });

        const updateEquation = () => {
            const m = (p2.Y() - p1.Y()) / (p2.X() - p1.X());
            const b = p1.Y() - m * p1.X();

            let mStr = m.toFixed(1);
            if (mStr === '1.0') mStr = '';
            else if (mStr === '-1.0') mStr = '-';

            const bStr = b > 0 ? `+ ${b.toFixed(1)}` : `- ${Math.abs(b).toFixed(1)}`;

            setInequality(`y > ${mStr}x ${bStr}`);
            onStateChangeRef.current?.({
                slope: parseFloat(m.toFixed(2)),
                intercept: parseFloat(b.toFixed(2)),
                inequality: `y > ${mStr}x ${bStr}`,
            });
        };

        p1.on('drag', updateEquation);
        p2.on('drag', updateEquation);

        // Initialize text
        updateEquation();

        return board;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <span className="text-slate-300">Region:</span>
                <span className="text-blue-400 font-mono text-lg">{inequality}</span>
            </div>
            <JSXGraphBoard initBoard={initBoard} />
        </div>
    );
}
