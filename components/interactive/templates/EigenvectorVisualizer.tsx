import React, { useState, useRef, useEffect } from 'react';
import JSXGraphBoard from '../JSXGraphBoard';
import type { EigenvectorVisualizerProps } from '@/types/jsxgraph-widgets';

export function EigenvectorVisualizer({
    initialVectorAngleDeg = 0,
    onStateChange,
}: EigenvectorVisualizerProps) {
    const [isEigen, setIsEigen] = useState(false);
    const [factor, setFactor] = useState('');
    const onStateChangeRef = useRef(onStateChange);
    useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

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

        const initRad = (initialVectorAngleDeg * Math.PI) / 180;
        const ptX = board.create('point', [Math.cos(initRad), Math.sin(initRad)], { name: 'x', size: 5, fillColor: '#3585a3', strokeColor: '#24718e' });
        board.create('arrow', [origin, ptX], { strokeColor: '#3585a3', strokeWidth: 3 });

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
                const dot = (ptX.X() * ptAx.X()) + (ptX.Y() * ptAx.Y());
                const magX = Math.sqrt(ptX.X() ** 2 + ptX.Y() ** 2);
                const magAx = Math.sqrt(ptAx.X() ** 2 + ptAx.Y() ** 2);
                const lambda = (dot > 0 ? 1 : -1) * (magAx / magX);

                setFactor(`\u03BB \u2248 ${lambda.toFixed(1)}`);
                ptX.setAttribute({ fillColor: '#10b981', strokeColor: '#059669' });
                onStateChangeRef.current?.({
                    vx: parseFloat(ptX.X().toFixed(2)),
                    vy: parseFloat(ptX.Y().toFixed(2)),
                    isEigenvector: true,
                    eigenvalue: parseFloat(lambda.toFixed(2)),
                });
            } else {
                setIsEigen(false);
                setFactor('');
                ptX.setAttribute({ fillColor: '#3585a3', strokeColor: '#24718e' });
                onStateChangeRef.current?.({
                    vx: parseFloat(ptX.X().toFixed(2)),
                    vy: parseFloat(ptX.Y().toFixed(2)),
                    isEigenvector: false,
                    eigenvalue: 0,
                });
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
