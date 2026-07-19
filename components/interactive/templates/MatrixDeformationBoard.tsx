import React, { useState, useRef, useEffect } from 'react';
import JSXGraphBoard from '../JSXGraphBoard';
import type { MatrixDeformationBoardProps } from '@/types/jsxgraph-widgets';

export function MatrixDeformationBoard({
    initialMatrix = [1, 0, 0, 1],
    onStateChange,
}: MatrixDeformationBoardProps) {
    const [iX0, iY0, jX0, jY0] = initialMatrix;
    const [matrix, setMatrix] = useState({ iX: iX0, iY: iY0, jX: jX0, jY: jY0 });
    const onStateChangeRef = useRef(onStateChange);
    useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

    const initBoard = (JXG: any, boardId: string) => {
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-5, 5, 5, -5],
            axis: true,
            showCopyright: false,
        });

        const origin = board.create('point', [0, 0], { visible: false });

        const iHat = board.create('point', [iX0, iY0], { name: 'i', size: 5, fillColor: '#10b981', strokeColor: '#059669' });
        const jHat = board.create('point', [jX0, jY0], { name: 'j', size: 5, fillColor: '#dfa81b', strokeColor: '#c08414' });

        board.create('arrow', [origin, iHat], { strokeColor: '#10b981', strokeWidth: 3 });
        board.create('arrow', [origin, jHat], { strokeColor: '#dfa81b', strokeWidth: 3 });

        // Deformed unit square
        const ptOrigin = board.create('point', [0, 0], { visible: false });
        const ptCorner = board.create('point', [
            () => iHat.X() + jHat.X(),
            () => iHat.Y() + jHat.Y()
        ], { visible: false });

        board.create('polygon', [ptOrigin, iHat, ptCorner, jHat], {
            fillColor: '#3585a3', fillOpacity: 0.2, borders: { strokeColor: '#3585a3', strokeWidth: 2 }
        });

        const updateMatrix = () => {
            const iXv = parseFloat(iHat.X().toFixed(1));
            const iYv = parseFloat(iHat.Y().toFixed(1));
            const jXv = parseFloat(jHat.X().toFixed(1));
            const jYv = parseFloat(jHat.Y().toFixed(1));
            setMatrix({ iX: iXv, iY: iYv, jX: jXv, jY: jYv });
            const det = iXv * jYv - jXv * iYv;
            onStateChangeRef.current?.({
                iX: iXv, iY: iYv, jX: jXv, jY: jYv,
                determinant: parseFloat(det.toFixed(2)),
            });
        };

        iHat.on('drag', updateMatrix);
        jHat.on('drag', updateMatrix);

        return board;
    };

    const det = (matrix.iX * matrix.jY) - (matrix.jX * matrix.iY);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex gap-4 font-mono text-slate-300">
                    <div>[ {matrix.iX.toFixed(1)} <br /> {matrix.iY.toFixed(1)} ]</div>
                    <div>[ {matrix.jX.toFixed(1)} <br /> {matrix.jY.toFixed(1)} ]</div>
                </div>
                <div className="text-right">
                    <div className="text-slate-400 text-sm">Determinant (Area Scale)</div>
                    <div className="text-blue-400 font-mono text-xl">{det.toFixed(2)}</div>
                </div>
            </div>
            <JSXGraphBoard initBoard={initBoard} />
        </div>
    );
}
