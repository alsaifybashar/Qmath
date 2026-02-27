import React, { useState } from 'react';
import JSXGraphBoard from '../JSXGraphBoard';

export function LinearSpanExplorer() {
    const [status, setStatus] = useState('Linearly Independent (Spans R2)');

    const initBoard = (JXG: any, boardId: string) => {
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-6, 6, 6, -6],
            axis: true,
            showCopyright: false,
        });

        const origin = board.create('point', [0, 0], { visible: false });

        // Basis vectors
        const b1 = board.create('point', [2, 1], { name: 'v_1', size: 4, fillColor: '#3b82f6', strokeColor: '#2563eb' });
        const b2 = board.create('point', [-1, 2], { name: 'v_2', size: 4, fillColor: '#10b981', strokeColor: '#059669' });

        board.create('arrow', [origin, b1], { strokeColor: '#3b82f6', strokeWidth: 2 });
        board.create('arrow', [origin, b2], { strokeColor: '#10b981', strokeWidth: 2 });

        // Span checking
        const checkSpan = () => {
            // Determine if b1 and b2 are collinear by checking determinant of matrix [b1 b2]
            const det = (b1.X() * b2.Y()) - (b2.X() * b1.Y());
            if (Math.abs(det) < 0.2) { // Close to zero threshold for snap/visual
                setStatus('Linearly Dependent (Spans a Line)');
            } else {
                setStatus('Linearly Independent (Spans \u211D\u00B2)');
            }
        };

        // Create span shaded region dynamically (only valid if det != 0)
        // A simple polygon bounded somewhat large to represent the plane
        const spanPol = board.create('polygon', [
            board.create('point', [-20, -20], { visible: false }),
            board.create('point', [20, -20], { visible: false }),
            board.create('point', [20, 20], { visible: false }),
            board.create('point', [-20, 20], { visible: false })
        ], {
            fillColor: () => Math.abs((b1.X() * b2.Y()) - (b2.X() * b1.Y())) < 0.2 ? 'transparent' : '#fef08a',
            fillOpacity: 0.1,
            borders: { visible: false }
        });

        // If dependent, draw the spanning line
        board.create('line', [origin, b1], {
            strokeColor: '#eab308',
            strokeWidth: 4,
            dash: 2,
            visible: () => Math.abs((b1.X() * b2.Y()) - (b2.X() * b1.Y())) < 0.2
        });

        b1.on('drag', checkSpan);
        b2.on('drag', checkSpan);

        return board;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <span className="text-slate-300">Target Vector status:</span>
                <span className={`font-mono text-lg ${status.includes('Dependent') ? 'text-amber-400' : 'text-blue-400'}`}>{status}</span>
            </div>
            <JSXGraphBoard initBoard={initBoard} />
        </div>
    );
}
