import React, { useState } from 'react';
import JSXGraphBoard from '../JSXGraphBoard';

export function EigenvectorVisualizer() {
    const [isEigen, setIsEigen] = useState(false);
    const [factor, setFactor] = useState('');

    const initBoard = (JXG: any, boardId: string) => {
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-6, 6, 6, -6],
            axis: true,
            showCopyright: false,
        });

        const origin = board.create('point', [0, 0], { visible: false });

        // Fixed hidden transformation matrix A = [[2, 1], [1, 2]]
        // Eigenvalues: 3 (vector [1,1]) and 1 (vector [-1,1])
        const A = [[2, 1], [1, 2]];

        // Draggable vector x
        const ptX = board.create('point', [1, 0], { name: 'x', size: 5, fillColor: '#3b82f6', strokeColor: '#2563eb' });
        board.create('arrow', [origin, ptX], { strokeColor: '#3b82f6', strokeWidth: 3 });

        // Transformed vector Ax
        const ptAx = board.create('point', [
            () => A[0][0] * ptX.X() + A[0][1] * ptX.Y(),
            () => A[1][0] * ptX.X() + A[1][1] * ptX.Y()
        ], { name: 'Ax', size: 4, fillColor: '#ef4444', strokeColor: '#dc2626' });

        const arrowAx = board.create('arrow', [origin, ptAx], { strokeColor: '#ef4444', strokeWidth: 2, dash: 2 });

        // Line spanning x
        board.create('line', [origin, ptX], { strokeColor: '#94a3b8', strokeWidth: 1, dash: 1 });

        const checkEigen = () => {
            // Check if x and Ax are parallel
            // det([x, Ax]) should be 0
            const det = (ptX.X() * ptAx.Y()) - (ptAx.X() * ptX.Y());

            if (Math.abs(det) < 0.1 && (Math.abs(ptX.X()) > 0.1 || Math.abs(ptX.Y()) > 0.1)) {
                setIsEigen(true);
                // Calculate lambda (eigenvalue) = |Ax| / |x|
                // handle sign based on dot product
                const dot = (ptX.X() * ptAx.X()) + (ptX.Y() * ptAx.Y());
                const magX = Math.sqrt(ptX.X() ** 2 + ptX.Y() ** 2);
                const magAx = Math.sqrt(ptAx.X() ** 2 + ptAx.Y() ** 2);
                const lambda = (dot > 0 ? 1 : -1) * (magAx / magX);

                setFactor(`\u03BB \u2248 ${lambda.toFixed(1)}`);
                ptX.setAttribute({ fillColor: '#10b981', strokeColor: '#059669' });
            } else {
                setIsEigen(false);
                setFactor('');
                ptX.setAttribute({ fillColor: '#3b82f6', strokeColor: '#2563eb' });
            }
        };

        ptX.on('drag', checkEigen);
        checkEigen();

        return board;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <span className="text-slate-300">Eigenvector Found:</span>
                <span className={`font-mono text-lg ${isEigen ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {isEigen ? `YES! (Eigenvalue ${factor})` : 'NO'}
                </span>
            </div>
            <JSXGraphBoard initBoard={initBoard} />
        </div>
    );
}
