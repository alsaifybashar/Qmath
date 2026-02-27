"use client";

import React from 'react';
import { InteractiveWidgetWrapper } from '@/components/interactive/InteractiveWidgetWrapper';
import { GridMultiplier } from '@/components/interactive/GridMultiplier';
import { ColumnAddition } from '@/components/interactive/ColumnAddition';
import JSXGraphBoard from '@/components/interactive/JSXGraphBoard';
import { useGraphStream } from '@/lib/hooks/useGraphStream';
import { PolynomialRootFinder } from '@/components/interactive/templates/PolynomialRootFinder';
import { InteractiveUnitCircle } from '@/components/interactive/templates/InteractiveUnitCircle';
import { InequalitiesVisualizer } from '@/components/interactive/templates/InequalitiesVisualizer';
import { VectorOperationsBoard } from '@/components/interactive/templates/VectorOperationsBoard';
import { MatrixDeformationBoard } from '@/components/interactive/templates/MatrixDeformationBoard';
import { LinearSpanExplorer } from '@/components/interactive/templates/LinearSpanExplorer';
import { EigenvectorVisualizer } from '@/components/interactive/templates/EigenvectorVisualizer';
import { IntersectingPlanes3D } from '@/components/interactive/templates/IntersectingPlanes3D';
import { DerivativeDefinitionBoard } from '@/components/interactive/templates/DerivativeDefinitionBoard';
import { CurveSketchingBoard } from '@/components/interactive/templates/CurveSketchingBoard';
import { RiemannSumsVisualizer } from '@/components/interactive/templates/RiemannSumsVisualizer';
import { TaylorSeriesApproximation } from '@/components/interactive/templates/TaylorSeriesApproximation';

function JSXGraphDemo() {
    const { streamState, lastMessage, isConnected } = useGraphStream('ws://127.0.0.1:8000/ws/math-engine');

    const initBoard = (JXG: any, boardId: string) => {
        const board = JXG.JSXGraph.initBoard(boardId, {
            boundingbox: [-5, 5, 5, -5],
            axis: true,
            showCopyright: false,
        });

        const p1 = board.create('point', [1, 1], { name: 'A', size: 5, fillColor: '#3b82f6', strokeColor: '#2563eb' });

        p1.on('drag', () => {
            // Stream state to websocket
            streamState({
                action: 'evaluate',
                expression: `x**2 + ${p1.Y().toFixed(2)}`,
                x: p1.X(),
                y: p1.Y()
            });

            // Simple proximity gradient logic
            const distanceToOrigin = Math.sqrt(p1.X() ** 2 + p1.Y() ** 2);
            if (distanceToOrigin < 1) {
                p1.setAttribute({ fillColor: '#ef4444', strokeColor: '#dc2626' }); // Red when close
            } else {
                p1.setAttribute({ fillColor: '#3b82f6', strokeColor: '#2563eb' }); // Blue otherwise
            }
        });

        return board;
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-4 items-center flex-wrap">
                <span className={`px-2 py-1 text-xs rounded-full ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {isConnected ? 'Math Engine Connected' : 'Math Engine Disconnected'}
                </span>
                {lastMessage && (
                    <span className="text-sm text-slate-400 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap max-w-sm">
                        {JSON.stringify(lastMessage)}
                    </span>
                )}
            </div>
            <JSXGraphBoard initBoard={initBoard} />
        </div>
    );
}

export default function TestInteractivePage() {
    return (
        <div className="min-h-screen bg-slate-900 p-8 space-y-16">

            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold text-white mb-2">Interactive Widgets Preview</h1>
                <p className="text-slate-400">Testing new visual components for Qmath.</p>

                {/* Widget 0: JSXGraph WebSocket Streaming Demo */}
                <div className="w-full">
                    <InteractiveWidgetWrapper
                        title="Real-Time Geometry (JSXGraph + AI Streaming)"
                        className="bg-slate-800"
                    >
                        <JSXGraphDemo />
                    </InteractiveWidgetWrapper>
                </div>

                {/* --- NEW CORE CURRICULUM TEMPLATES --- */}

                <div className="w-full">
                    <InteractiveWidgetWrapper
                        title="Polynomial Root Finder"
                        className="bg-slate-800"
                    >
                        <PolynomialRootFinder />
                    </InteractiveWidgetWrapper>
                </div>

                <div className="w-full">
                    <InteractiveWidgetWrapper
                        title="Interactive Unit Circle & Sine Wave"
                        className="bg-slate-800"
                    >
                        <InteractiveUnitCircle />
                    </InteractiveWidgetWrapper>
                </div>

                <div className="w-full">
                    <InteractiveWidgetWrapper
                        title="Inequalities & Regions"
                        className="bg-slate-800"
                    >
                        <InequalitiesVisualizer />
                    </InteractiveWidgetWrapper>
                </div>

                {/* --- LINEAR ALGEBRA TEMPLATES --- */}

                <div className="w-full">
                    <InteractiveWidgetWrapper
                        title="Vector Operations (Parallelogram & Dot Product)"
                        className="bg-slate-800"
                    >
                        <VectorOperationsBoard />
                    </InteractiveWidgetWrapper>
                </div>

                <div className="w-full">
                    <InteractiveWidgetWrapper
                        title="Matrix Deformation (Basis Transforms)"
                        className="bg-slate-800"
                    >
                        <MatrixDeformationBoard />
                    </InteractiveWidgetWrapper>
                </div>

                <div className="w-full">
                    <InteractiveWidgetWrapper
                        title="Linear Span & Independence Explorer"
                        className="bg-slate-800"
                    >
                        <LinearSpanExplorer />
                    </InteractiveWidgetWrapper>
                </div>

                <div className="w-full">
                    <InteractiveWidgetWrapper
                        title="Eigenvector Finder (Invariant Lines)"
                        className="bg-slate-800"
                    >
                        <EigenvectorVisualizer />
                    </InteractiveWidgetWrapper>
                </div>

                <div className="w-full">
                    <InteractiveWidgetWrapper
                        title="Intersecting Planes (3D Systems)"
                        className="bg-slate-800"
                    >
                        <IntersectingPlanes3D />
                    </InteractiveWidgetWrapper>
                </div>

                {/* --- SINGLE-VARIABLE CALCULUS TEMPLATES --- */}

                <div className="w-full">
                    <InteractiveWidgetWrapper
                        title="Derivative Definition (Secant to Tangent)"
                        className="bg-slate-800"
                    >
                        <DerivativeDefinitionBoard />
                    </InteractiveWidgetWrapper>
                </div>

                <div className="w-full">
                    <InteractiveWidgetWrapper
                        title="Curve Sketching (f vs f' vs f'')"
                        className="bg-slate-800"
                    >
                        <CurveSketchingBoard />
                    </InteractiveWidgetWrapper>
                </div>

                <div className="w-full">
                    <InteractiveWidgetWrapper
                        title="Riemann Sums (Integral Accumulation)"
                        className="bg-slate-800"
                    >
                        <RiemannSumsVisualizer />
                    </InteractiveWidgetWrapper>
                </div>

                <div className="w-full">
                    <InteractiveWidgetWrapper
                        title="Taylor Series Approximation (sin(x))"
                        className="bg-slate-800"
                    >
                        <TaylorSeriesApproximation />
                    </InteractiveWidgetWrapper>
                </div>

                {/* --- END NEW TEMPLATES --- */}

                {/* Widget 1: Synthesis-style Grid Multiplier */}
                <div className="w-full">
                    <InteractiveWidgetWrapper
                        title="Visual Multiplication"
                        scoreboard={<div className="text-cyan-400 font-mono text-xl">Score: 100</div>}
                    >
                        <GridMultiplier
                            initialRows={2}
                            initialCols={2}
                            targetRows={4}
                            targetCols={4}
                        />
                    </InteractiveWidgetWrapper>
                </div>

                {/* Widget 2: Column Addition */}
                <div className="w-full">
                    <InteractiveWidgetWrapper
                        title="Multi-Digit Addition"
                        className="bg-slate-800"
                    >
                        <ColumnAddition
                            numbers={[998795, 712966, 718383]}
                        />
                    </InteractiveWidgetWrapper>
                </div>

            </div>

        </div>
    );
}
