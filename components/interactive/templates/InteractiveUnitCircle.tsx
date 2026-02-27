import React, { useState } from 'react';
import JSXGraphBoard from '../JSXGraphBoard';

export function InteractiveUnitCircle() {
    const [angle, setAngle] = useState('45°');
    const [sinVal, setSinVal] = useState('0.71');
    const [cosVal, setCosVal] = useState('0.71');

    const initBoard = (JXG: any, boardId: string) => {
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-1.5, 2, 5, -2], // Show unrolled wave to the right
            axis: true,
            showCopyright: false,
        });

        // Unit circle
        const circle = board.create('circle', [[0, 0], 1], { strokeColor: '#slate-600', strokeWidth: 2, dash: 2 });

        // Origin
        const origin = board.create('point', [0, 0], { visible: false });

        // Draggable point on the unit circle
        const p = board.create('glider', [0.707, 0.707, circle], { name: 'P', size: 5, fillColor: '#3b82f6', strokeColor: '#2563eb' });

        // Line from origin to P
        board.create('segment', [origin, p], { strokeColor: '#94a3b8', strokeWidth: 2 });

        // Triangle for sine/cosine components
        const pX = board.create('point', [() => p.X(), 0], { visible: false });
        // Cosine segment (x-axis)
        board.create('segment', [origin, pX], { strokeColor: '#f59e0b', strokeWidth: 3 });
        // Sine segment (vertical)
        const sinSeg = board.create('segment', [pX, p], { strokeColor: '#10b981', strokeWidth: 3 });

        // Angle arc
        const pRef = board.create('point', [1, 0], { visible: false });
        const arc = board.create('angle', [pRef, origin, p], { radius: 0.3, fillColor: '#3b82f6', fillOpacity: 0.2 });

        // Unwrapped Sine Wave logic
        // We will map the angle to the x-axis starting from x = 1.5
        const waveStartX = 1.5;

        const sineWave = board.create('functiongraph', [
            (x: number) => Math.sin(x - waveStartX),
            waveStartX, waveStartX + 2 * Math.PI
        ], { strokeColor: '#10b981', strokeWidth: 2, dash: 1 });

        // A point on the sine wave corresponding to the current angle
        const getAngle = () => {
            let a = Math.atan2(p.Y(), p.X());
            if (a < 0) a += 2 * Math.PI;
            return a;
        };

        const wavePoint = board.create('point', [
            () => waveStartX + getAngle(),
            () => p.Y()
        ], { name: 'sin(θ)', size: 4, fillColor: '#10b981', strokeColor: '#059669' });

        // Dotted line connecting circle point P to the wave point
        board.create('segment', [p, wavePoint], { strokeColor: '#64748b', strokeWidth: 1, dash: 2 });

        // Update React State
        p.on('drag', () => {
            const rad = getAngle();
            const deg = (rad * 180 / Math.PI).toFixed(0);
            setAngle(`${deg}°`);
            setSinVal(p.Y().toFixed(2));
            setCosVal(p.X().toFixed(2));
        });

        return board;
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center">
                <div>
                    <div className="text-slate-400 text-sm">Angle (θ)</div>
                    <div className="text-blue-400 font-mono text-xl">{angle}</div>
                </div>
                <div>
                    <div className="text-slate-400 text-sm">sin(θ)</div>
                    <div className="text-emerald-400 font-mono text-xl">{sinVal}</div>
                </div>
                <div>
                    <div className="text-slate-400 text-sm">cos(θ)</div>
                    <div className="text-amber-400 font-mono text-xl">{cosVal}</div>
                </div>
            </div>
            <JSXGraphBoard initBoard={initBoard} />
        </div>
    );
}
