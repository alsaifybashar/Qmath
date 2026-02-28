import React, { useState, useRef, useEffect } from 'react';
import JSXGraphBoard from '../JSXGraphBoard';
import type { DerivativeDefinitionBoardProps } from '@/types/jsxgraph-widgets';

export function DerivativeDefinitionBoard({
    initialH = 1.5,
    onStateChange,
}: DerivativeDefinitionBoardProps) {
    const [hVal, setHVal] = useState(initialH.toFixed(2));
    const [secantSlope, setSecantSlope] = useState('0');
    const onStateChangeRef = useRef(onStateChange);
    useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

    const initBoard = (JXG: any, boardId: string) => {
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-2, 10, 8, -2],
            axis: true,
            showCopyright: false,
        });

        // The function f(x) = 0.5 * x^2 + 1
        const f = (x: number) => 0.5 * x * x + 1;
        board.create('functiongraph', [f], { strokeColor: '#3b82f6', strokeWidth: 3 });

        // Fixed point x
        const ptX = board.create('glider', [2, f(2), board.defaultAxes.x], { name: 'x', size: 4, visible: false });
        const ptF = board.create('point', [() => ptX.X(), () => f(ptX.X())], { name: 'f(x)', size: 4, fillColor: '#3b82f6', strokeColor: '#2563eb', fixed: true });

        const ptH = board.create('glider', [2 + initialH, 0, board.defaultAxes.x], { name: 'x+h', size: 5, fillColor: '#ef4444', strokeColor: '#dc2626' });
        const ptFH = board.create('point', [() => ptH.X(), () => f(ptH.X())], { name: 'f(x+h)', size: 4, fillColor: '#ef4444', strokeColor: '#dc2626' });

        // Construction lines
        board.create('segment', [ptH, ptFH], { strokeColor: '#94a3b8', strokeWidth: 1, dash: 2 });
        board.create('segment', [ptF, [() => ptF.X(), 0]], { strokeColor: '#94a3b8', strokeWidth: 1, dash: 2 });

        // Horizontal delta X
        board.create('segment', [ptF, [() => ptH.X(), () => ptF.Y()]], { strokeColor: '#10b981', strokeWidth: 2 });
        // Vertical delta Y
        board.create('segment', [[() => ptH.X(), () => ptF.Y()], ptFH], { strokeColor: '#f59e0b', strokeWidth: 2 });

        // The secant line
        const secant = board.create('line', [ptF, ptFH], { strokeColor: '#8b5cf6', strokeWidth: 2 });

        // The true tangent line (for reference when h approaches 0)
        board.create('line', [
            ptF,
            [() => ptF.X() + 1, () => ptF.Y() + ptX.X()] // f'(x) = x, so slope is x. rise/run = x / 1
        ], { strokeColor: '#10b981', strokeWidth: 2, dash: 1, visible: () => Math.abs(ptH.X() - ptX.X()) < 0.2 });

        const updateMath = () => {
            const h = ptH.X() - ptX.X();
            // Prevent division by zero visually by clamping near 0
            if (Math.abs(h) < 0.05) {
                ptH.moveTo([ptX.X() + 0.05, 0]);
                return;
            }
            const slope = (f(ptH.X()) - f(ptX.X())) / h;
            setHVal(h.toFixed(2));
            setSecantSlope(slope.toFixed(2));
            onStateChangeRef.current?.({
                hVal: parseFloat(h.toFixed(2)),
                secantSlope: parseFloat(slope.toFixed(2)),
            });
        };

        ptH.on('drag', updateMath);
        updateMath();

        return board;
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center">
                <div>
                    <div className="text-slate-400 text-sm">Distance (h)</div>
                    <div className="text-red-400 font-mono text-xl">{hVal}</div>
                </div>
                <div>
                    <div className="text-slate-400 text-sm">Secant Slope m = Δy/Δx</div>
                    <div className="text-violet-400 font-mono text-xl">{secantSlope}</div>
                </div>
            </div>
            <JSXGraphBoard initBoard={initBoard} />
        </div>
    );
}
