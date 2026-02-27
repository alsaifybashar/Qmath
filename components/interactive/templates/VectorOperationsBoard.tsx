import React, { useState } from 'react';
import JSXGraphBoard from '../JSXGraphBoard';

export function VectorOperationsBoard() {
    const [dotProduct, setDotProduct] = useState('0');

    const initBoard = (JXG: any, boardId: string) => {
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-7, 7, 7, -7],
            axis: true,
            grid: true,
            showCopyright: false,
        });

        const origin = board.create('point', [0, 0], { visible: false });

        // Vector u
        const ptU = board.create('point', [3, 2], { name: 'u', size: 4, fillColor: '#3b82f6', strokeColor: '#2563eb' });
        const vecU = board.create('arrow', [origin, ptU], { strokeColor: '#3b82f6', strokeWidth: 3 });

        // Vector v
        const ptV = board.create('point', [1, 5], { name: 'v', size: 4, fillColor: '#ef4444', strokeColor: '#dc2626' });
        const vecV = board.create('arrow', [origin, ptV], { strokeColor: '#ef4444', strokeWidth: 3 });

        // Parallelogram rule: Vector w = u + v
        const ptW = board.create('point', [
            () => ptU.X() + ptV.X(),
            () => ptU.Y() + ptV.Y()
        ], { name: 'u+v', size: 4, fillColor: '#10b981', strokeColor: '#059669' });

        const vecW = board.create('arrow', [origin, ptW], { strokeColor: '#10b981', strokeWidth: 4 });

        // Dashed construction lines for parallelogram
        board.create('segment', [ptU, ptW], { strokeColor: '#94a3b8', strokeWidth: 1, dash: 2 });
        board.create('segment', [ptV, ptW], { strokeColor: '#94a3b8', strokeWidth: 1, dash: 2 });

        // Dot product calculation
        const updateMath = () => {
            const dot = (ptU.X() * ptV.X()) + (ptU.Y() * ptV.Y());
            setDotProduct(dot.toFixed(1));
        };

        ptU.on('drag', updateMath);
        ptV.on('drag', updateMath);
        updateMath();

        return board;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <span className="text-slate-300">Dot Product (\u00B7):</span>
                <span className="text-emerald-400 font-mono text-lg">{dotProduct}</span>
            </div>
            <JSXGraphBoard initBoard={initBoard} />
        </div>
    );
}
