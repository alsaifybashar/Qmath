"use client";

import React from 'react';
import { InteractiveWidgetWrapper } from '@/components/interactive/InteractiveWidgetWrapper';
import { GridMultiplier } from '@/components/interactive/GridMultiplier';
import { ColumnAddition } from '@/components/interactive/ColumnAddition';

export default function TestInteractivePage() {
    return (
        <div className="min-h-screen bg-slate-900 p-8 space-y-16">

            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold text-white mb-2">Interactive Widgets Preview</h1>
                <p className="text-slate-400">Testing new visual components for Qmath.</p>

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
