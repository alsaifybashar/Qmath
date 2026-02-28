import React, { useState, useRef, useEffect } from 'react';
import JSXGraphBoard from '../JSXGraphBoard';
import type { VectorOperationsBoardProps } from '@/types/jsxgraph-widgets';

export function VectorOperationsBoard({
    initialU = [3, 2],
    initialV = [1, 5],
    onStateChange,
}: VectorOperationsBoardProps) {
    const [dotProduct, setDotProduct] = useState('0');
    const onStateChangeRef = useRef(onStateChange);
    useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

    const initBoard = (JXG: any, boardId: string) => {
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-7, 7, 7, -7],
            axis: true,
            grid: true,
            showCopyright: false,
        });

        const origin = board.create('point', [0, 0], { visible: false });

        const ptU = board.create('point', [initialU[0], initialU[1]], { name: 'u', size: 4, fillColor: '#3b82f6', strokeColor: '#2563eb' });
        board.create('arrow', [origin, ptU], { strokeColor: '#3b82f6', strokeWidth: 3 });

        const ptV = board.create('point', [initialV[0], initialV[1]], { name: 'v', size: 4, fillColor: '#ef4444', strokeColor: '#dc2626' });
        board.create('arrow', [origin, ptV], { strokeColor: '#ef4444', strokeWidth: 3 });

        // Parallelogram rule: Vector w = u + v
        const ptW = board.create('point', [
            () => ptU.X() + ptV.X(),
            () => ptU.Y() + ptV.Y()
        ], { name: 'u+v', size: 4, fillColor: '#10b981', strokeColor: '#059669' });

        const vecW = board.create('arrow', [origin, ptW], { strokeColor: '#10b981', strokeWidth: 4 });

        // Dashed construction lines for parallelogram
        board.create('segment', [ptU, ptW], { strokeColor: '#94a3b8', strokeWidth: 1, dash: 2 });
        board.create('segment', [ptV, ptW], { strokeColor: '#94a3b8', strokeWidth: 1, dash: 2 });

        const updateMath = () => {
            const dot = (ptU.X() * ptV.X()) + (ptU.Y() * ptV.Y());
            setDotProduct(dot.toFixed(1));
            onStateChangeRef.current?.({
                ux: parseFloat(ptU.X().toFixed(2)),
                uy: parseFloat(ptU.Y().toFixed(2)),
                vx: parseFloat(ptV.X().toFixed(2)),
                vy: parseFloat(ptV.Y().toFixed(2)),
                dotProduct: parseFloat(dot.toFixed(2)),
            });
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
