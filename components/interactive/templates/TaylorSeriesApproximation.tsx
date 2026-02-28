import React, { useState, useRef, useEffect } from 'react';
import JSXGraphBoard from '../JSXGraphBoard';
import type { TaylorSeriesApproximationProps } from '@/types/jsxgraph-widgets';

export function TaylorSeriesApproximation({
    initialDegree = 1,
    centerPoint: initialCenter = 0,
    onStateChange,
}: TaylorSeriesApproximationProps) {
    const [degree, setDegree] = useState(initialDegree.toString());
    const onStateChangeRef = useRef(onStateChange);
    useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

    const initBoard = (JXG: any, boardId: string) => {
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-5, 5, 5, -5],
            axis: true,
            showCopyright: false,
        });

        // The exact function: sin(x)
        const f = (x: number) => Math.sin(x);
        board.create('functiongraph', [f], { strokeColor: '#e2e8f0', strokeWidth: 4 }); // Background exact function

        const centerPoint = board.create('glider', [initialCenter, 0, board.defaultAxes.x], { name: 'a', size: 5, fillColor: '#3b82f6', strokeColor: '#2563eb' });

        const clampedDeg = Math.max(0, Math.min(9, initialDegree));
        const nSlider = board.create('slider', [[-4, -4], [-1, -4], [0, clampedDeg, 9]], { name: 'Degree n', snapWidth: 1 });

        // Helper for factorial!
        const fact = (num: number): number => {
            if (num <= 1) return 1;
            return num * fact(num - 1);
        };

        // Approximated Taylor polynomial for sin(x) around point 'a'
        // f(x) = sum(0 to n) of (f^(k)(a) / k!) * (x-a)^k
        // For sin(x): 0th der is sin(a), 1st is cos(a), 2nd is -sin(a), 3rd is -cos(a), etc.
        const taylorApproximation = (x: number) => {
            let sum = 0;
            const n = Math.round(nSlider.Value());
            const a = centerPoint.X();

            for (let k = 0; k <= n; k++) {
                let derivativeAtA = 0;
                const rem = k % 4;
                if (rem === 0) derivativeAtA = Math.sin(a);
                if (rem === 1) derivativeAtA = Math.cos(a);
                if (rem === 2) derivativeAtA = -Math.sin(a);
                if (rem === 3) derivativeAtA = -Math.cos(a);

                sum += (derivativeAtA / fact(k)) * Math.pow(x - a, k);
            }
            return sum;
        };

        board.create('functiongraph', [taylorApproximation], { strokeColor: '#10b981', strokeWidth: 2 });

        const updateUI = () => {
            const d = Math.round(nSlider.Value());
            setDegree(d.toString());
            onStateChangeRef.current?.({
                degree: d,
                center: parseFloat(centerPoint.X().toFixed(2)),
            });
        };
        centerPoint.on('drag', updateUI);

        nSlider.on('drag', updateUI);
        updateUI();

        return board;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <span className="text-slate-300">Approximation Data:</span>
                <span className="text-emerald-400 font-mono text-lg">Taylor Polynomial Degree: {degree}</span>
            </div>
            <JSXGraphBoard initBoard={initBoard} />
        </div>
    );
}
