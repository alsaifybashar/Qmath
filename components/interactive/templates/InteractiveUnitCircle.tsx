import React, { useState, useRef, useEffect } from 'react';
import JSXGraphBoard from '../JSXGraphBoard';
import type { InteractiveUnitCircleProps } from '@/types/jsxgraph-widgets';

export function InteractiveUnitCircle({
    initialAngleDeg = 45,
    onStateChange,
}: InteractiveUnitCircleProps) {
    const initRad = (initialAngleDeg * Math.PI) / 180;
    const [angle, setAngle] = useState(`${initialAngleDeg}°`);
    const [sinVal, setSinVal] = useState(Math.sin(initRad).toFixed(2));
    const [cosVal, setCosVal] = useState(Math.cos(initRad).toFixed(2));
    const onStateChangeRef = useRef(onStateChange);
    useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

    const initBoard = (JXG: any, boardId: string) => {
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-1.5, 2, 5, -2],
            axis: true,
            showCopyright: false,
        });

        const circle = board.create('circle', [[0, 0], 1], { strokeColor: '#slate-600', strokeWidth: 2, dash: 2 });
        const origin = board.create('point', [0, 0], { visible: false });

        const startX = Math.cos(initRad);
        const startY = Math.sin(initRad);
        const p = board.create('glider', [startX, startY, circle], { name: 'P', size: 5, fillColor: '#3585a3', strokeColor: '#24718e' });

        // Line from origin to P
        board.create('segment', [origin, p], { strokeColor: '#94a3b8', strokeWidth: 2 });

        // Triangle for sine/cosine components
        const pX = board.create('point', [() => p.X(), 0], { visible: false });
        // Cosine segment (x-axis)
        board.create('segment', [origin, pX], { strokeColor: '#dfa81b', strokeWidth: 3 });
        // Sine segment (vertical)
        const sinSeg = board.create('segment', [pX, p], { strokeColor: '#10b981', strokeWidth: 3 });

        // Angle arc
        const pRef = board.create('point', [1, 0], { visible: false });
        const arc = board.create('angle', [pRef, origin, p], { radius: 0.3, fillColor: '#3585a3', fillOpacity: 0.2 });

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
            onStateChangeRef.current?.({
                angleDeg: parseFloat(deg),
                sinVal: parseFloat(p.Y().toFixed(2)),
                cosVal: parseFloat(p.X().toFixed(2)),
            });
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
