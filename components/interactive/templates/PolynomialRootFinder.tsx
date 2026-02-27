import React, { useState } from 'react';
import JSXGraphBoard from '../JSXGraphBoard';

export function PolynomialRootFinder() {
    const [equation, setEquation] = useState('y = (x - 1)(x + 1)');

    const initBoard = (JXG: any, boardId: string) => {
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-5, 5, 5, -5],
            axis: true,
            showCopyright: false,
            showNavigation: false,
        });

        // Two roots on the x-axis
        const r1 = board.create('glider', [-1, 0, board.defaultAxes.x], { name: 'r_1', size: 5, fillColor: '#3b82f6', strokeColor: '#2563eb' });
        const r2 = board.create('glider', [1, 0, board.defaultAxes.x], { name: 'r_2', size: 5, fillColor: '#ef4444', strokeColor: '#dc2626' });

        // A scaling factor (vertex control) - let's fix a=1 for simplicity or let it be defined by a third point
        // For simplicity, let's plot f(x) = (x - r1.X()) * (x - r2.X())
        const f = board.create('functiongraph', [
            (x: number) => (x - r1.X()) * (x - r2.X())
        ], { strokeColor: '#10b981', strokeWidth: 3 });

        // Update the React state when roots move to show the equation
        const updateEquation = () => {
            const val1 = r1.X() > 0 ? `- ${r1.X().toFixed(1)}` : `+ ${Math.abs(r1.X()).toFixed(1)}`;
            const val2 = r2.X() > 0 ? `- ${r2.X().toFixed(1)}` : `+ ${Math.abs(r2.X()).toFixed(1)}`;
            setEquation(`y = (x ${val1})(x ${val2})`);
        };

        r1.on('drag', updateEquation);
        r2.on('drag', updateEquation);

        return board;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <span className="text-slate-300">Factored Form:</span>
                <span className="text-green-400 font-mono text-lg">{equation}</span>
            </div>
            <JSXGraphBoard initBoard={initBoard} />
        </div>
    );
}
