import React, { useState, useRef, useEffect } from 'react';
import JSXGraphBoard from '../JSXGraphBoard';
import type { RiemannSumsVisualizerProps } from '@/types/jsxgraph-widgets';

export function RiemannSumsVisualizer({
    initialN = 5,
    method = 'middle',
    onStateChange,
}: RiemannSumsVisualizerProps) {
    const [area, setArea] = useState('0');
    const onStateChangeRef = useRef(onStateChange);
    useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

    const initBoard = (JXG: any, boardId: string) => {
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-1, 10, 6, -2],
            axis: true,
            showCopyright: false,
        });

        const f = (x: number) => -0.5 * Math.pow(x - 3, 2) + 8;
        board.create('functiongraph', [f, 0, 5], { strokeColor: '#3b82f6', strokeWidth: 3 });

        const clampedN = Math.max(1, Math.min(20, initialN));
        const nSlider = board.create('slider', [[1, -1], [4, -1], [1, clampedN, 20]], { name: 'n', snapWidth: 1 });

        const rsum = board.create('riemannsum', [
            f,
            () => nSlider.Value(),
            method,
            0,
            5
        ], { fillColor: '#10b981', fillOpacity: 0.3 });

        const updateMath = () => {
            const areaVal = rsum.Value();
            setArea(areaVal.toFixed(3));
            onStateChangeRef.current?.({
                n: Math.round(nSlider.Value()),
                approximatedArea: parseFloat(areaVal.toFixed(3)),
            });
        };

        nSlider.on('drag', updateMath);
        setTimeout(updateMath, 100); // Initial calculation

        return board;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <span className="text-slate-300">Approximated Area (Midpoint):</span>
                <span className="text-emerald-400 font-mono text-lg">{area}</span>
            </div>
            <JSXGraphBoard initBoard={initBoard} />
        </div>
    );
}
