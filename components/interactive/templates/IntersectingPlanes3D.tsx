import React, { useState } from 'react';
import JSXGraphBoard from '../JSXGraphBoard';

export function IntersectingPlanes3D() {
    const [status, setStatus] = useState('Line of Intersection');

    const initBoard = (JXG: any, boardId: string) => {
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-8, 8, 8, -8],
            keepaspectratio: false,
            axis: false,
            showCopyright: false,
        });

        const box = [-5, 5];
        const view = board.create('view3d',
            [
                [-6, -3], [8, 8],
                [box, box, box]
            ],
            {
                xAngle: Math.PI / 4,
                yAngle: Math.PI / 6,
                zAngle: 0,
            }
        );

        // Plane 1: z = 2 - x - y
        const plane1 = view.create('parametricsurface3d', [
            (u: number, v: number) => u,
            (u: number, v: number) => v,
            (u: number, v: number) => 2 - u - v,
            [-3, 3], [-3, 3]
        ], { strokeWidth: 0, fillColor: '#3b82f6', fillOpacity: 0.6 });

        // Plane 2: z = x - y + k (draggable point to adjust k)
        const kLine = board.create('line', [[-5, -6], [5, -6]], { visible: true, strokeColor: '#475569', strokeWidth: 4 });
        const pk = board.create('glider', [0, -6, kLine], { name: 'Shift k', size: 5, fillColor: '#f59e0b' });

        const plane2 = view.create('parametricsurface3d', [
            (u: number, v: number) => u,
            (u: number, v: number) => v,
            (u: number, v: number) => u - v + pk.X(),
            [-3, 3], [-3, 3]
        ], { strokeWidth: 0, fillColor: '#10b981', fillOpacity: 0.6 });

        return board;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <span className="text-slate-300">Intersection Type:</span>
                <span className="text-indigo-400 font-mono text-lg">{status}</span>
            </div>
            <JSXGraphBoard initBoard={initBoard} />
            <p className="text-sm text-slate-400">Drag the yellow slider below the 3D box to translate the green plane along the z-axis.</p>
        </div>
    );
}
