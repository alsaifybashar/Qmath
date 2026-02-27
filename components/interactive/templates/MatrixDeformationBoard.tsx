import React, { useState } from 'react';
import JSXGraphBoard from '../JSXGraphBoard';

export function MatrixDeformationBoard() {
    // Identity matrix default
    const [matrix, setMatrix] = useState({ iX: 1, iY: 0, jX: 0, jY: 1 });

    const initBoard = (JXG: any, boardId: string) => {
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-5, 5, 5, -5],
            axis: true,
            showCopyright: false,
        });

        const origin = board.create('point', [0, 0], { visible: false });

        // Basis vectors (i-hat and j-hat equivalent) mapped onto interactive points
        const iHat = board.create('point', [1, 0], { name: 'i', size: 5, fillColor: '#10b981', strokeColor: '#059669' });
        const jHat = board.create('point', [0, 1], { name: 'j', size: 5, fillColor: '#f59e0b', strokeColor: '#d97706' });

        board.create('arrow', [origin, iHat], { strokeColor: '#10b981', strokeWidth: 3 });
        board.create('arrow', [origin, jHat], { strokeColor: '#f59e0b', strokeWidth: 3 });

        // Deformed unit square
        const ptOrigin = board.create('point', [0, 0], { visible: false });
        const ptCorner = board.create('point', [
            () => iHat.X() + jHat.X(),
            () => iHat.Y() + jHat.Y()
        ], { visible: false });

        board.create('polygon', [ptOrigin, iHat, ptCorner, jHat], {
            fillColor: '#3b82f6', fillOpacity: 0.2, borders: { strokeColor: '#3b82f6', strokeWidth: 2 }
        });

        // Determinant area calculation
        const updateMatrix = () => {
            setMatrix({
                iX: parseFloat(iHat.X().toFixed(1)),
                iY: parseFloat(iHat.Y().toFixed(1)),
                jX: parseFloat(jHat.X().toFixed(1)),
                jY: parseFloat(jHat.Y().toFixed(1))
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
