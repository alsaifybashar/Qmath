import React, { useState } from 'react';
import JSXGraphBoard from '../JSXGraphBoard';

export function RiemannSumsVisualizer() {
    const [area, setArea] = useState('0');

    const initBoard = (JXG: any, boardId: string) => {
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-1, 10, 6, -2],
            axis: true,
            showCopyright: false,
        });

        const f = (x: number) => -0.5 * Math.pow(x - 3, 2) + 8;
        board.create('functiongraph', [f, 0, 5], { strokeColor: '#3b82f6', strokeWidth: 3 });

        // Slider for n partitions
        const nSlider = board.create('slider', [[1, -1], [4, -1], [1, 5, 20]], { name: 'n', snapWidth: 1 });

        // Riemann sum: board.create('riemannsum', [f, n, type, x0, x1])
        // type: 'left', 'right', 'middle'
        const rsum = board.create('riemannsum', [
            f,
            () => nSlider.Value(),
            'middle',
            0,
            5
        ], { fillColor: '#10b981', fillOpacity: 0.3 });

        const updateMath = () => {
            setArea(rsum.Value().toFixed(3));
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
