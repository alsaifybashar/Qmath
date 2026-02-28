import React, { useState, useRef, useEffect } from 'react';
import JSXGraphBoard from '../JSXGraphBoard';
import type { LinearSpanExplorerProps } from '@/types/jsxgraph-widgets';

export function LinearSpanExplorer({
    initialV1 = [2, 1],
    initialV2 = [-1, 2],
    onStateChange,
}: LinearSpanExplorerProps) {
    const [status, setStatus] = useState('Linearly Independent (Spans \u211D\u00B2)');
    const onStateChangeRef = useRef(onStateChange);
    useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

    const initBoard = (JXG: any, boardId: string) => {
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-6, 6, 6, -6],
            axis: true,
            showCopyright: false,
        });

        const origin = board.create('point', [0, 0], { visible: false });

        const b1 = board.create('point', [initialV1[0], initialV1[1]], { name: 'v_1', size: 4, fillColor: '#3b82f6', strokeColor: '#2563eb' });
        const b2 = board.create('point', [initialV2[0], initialV2[1]], { name: 'v_2', size: 4, fillColor: '#10b981', strokeColor: '#059669' });

        board.create('arrow', [origin, b1], { strokeColor: '#3b82f6', strokeWidth: 2 });
        board.create('arrow', [origin, b2], { strokeColor: '#10b981', strokeWidth: 2 });

        const checkSpan = () => {
            const det = (b1.X() * b2.Y()) - (b2.X() * b1.Y());
            const isDependent = Math.abs(det) < 0.2;
            const newStatus = isDependent ? 'Linearly Dependent (Spans a Line)' : 'Linearly Independent (Spans \u211D\u00B2)';
            setStatus(newStatus);
            onStateChangeRef.current?.({
                v1x: parseFloat(b1.X().toFixed(2)),
                v1y: parseFloat(b1.Y().toFixed(2)),
                v2x: parseFloat(b2.X().toFixed(2)),
                v2y: parseFloat(b2.Y().toFixed(2)),
                status: newStatus,
            });
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
