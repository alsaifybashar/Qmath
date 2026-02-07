'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Brain, Zap } from 'lucide-react';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

const MODES: Record<TimerMode, { label: string; minutes: number; color: string; icon: React.ElementType }> = {
    focus: { label: 'Focus', minutes: 25, color: '#ef4444', icon: Brain },
    shortBreak: { label: 'Short Break', minutes: 5, color: '#22c55e', icon: Coffee },
    longBreak: { label: 'Long Break', minutes: 15, color: '#3b82f6', icon: Zap },
};

export default function PomodoroTimer() {
    const [mode, setMode] = useState<TimerMode>('focus');
    const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
    const [isActive, setIsActive] = useState(false);
    const [sessionCount, setSessionCount] = useState(0);

    const endTimeRef = useRef<number | null>(null);
    const requestRef = useRef<number | null>(null);

    // Reset timer when mode changes
    useEffect(() => {
        setTimeLeft(MODES[mode].minutes * 60);
        setIsActive(false);
    }, [mode]);

    // Timer logic with requestAnimationFrame for accuracy
    const animate = useCallback((time: number) => {
        if (!endTimeRef.current) return;

        const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining > 0) {
            requestRef.current = requestAnimationFrame(animate);
        } else {
            setIsActive(false);
            if (mode === 'focus') {
                setSessionCount(c => c + 1);
                // Play notification sound here
            }
        }
    }, [mode]);

    useEffect(() => {
        if (isActive) {
            endTimeRef.current = Date.now() + timeLeft * 1000;
            requestRef.current = requestAnimationFrame(animate);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            endTimeRef.current = null;
        }

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isActive, animate]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(MODES[mode].minutes * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = 1 - timeLeft / (MODES[mode].minutes * 60);
    const CurrentIcon = MODES[mode].icon;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 h-full flex flex-col items-center justify-between relative overflow-hidden">
            {/* Background Gradient */}
            <div
                className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50"
                style={{ color: MODES[mode].color }}
            />

            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6 z-10">
                <h3 className="font-bold flex items-center gap-2">
                    <span className="text-xl">⏱️</span>
                    Focus Timer
                </h3>
                <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 gap-1">
                    {(Object.keys(MODES) as TimerMode[]).map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`p-2 rounded-md transition-all ${mode === m
                                    ? 'bg-white dark:bg-zinc-700 shadow-sm'
                                    : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500'
                                }`}
                            title={MODES[m].label}
                        >
                            {m === 'focus' ? <Brain size={16} /> : m === 'shortBreak' ? <Coffee size={16} /> : <Zap size={16} />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timer Display */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                {/* SVG Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                        cx="96"
                        cy="96"
                        r="88"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-zinc-100 dark:text-zinc-800"
                    />
                    <motion.circle
                        cx="96"
                        cy="96"
                        r="88"
                        fill="none"
                        stroke={MODES[mode].color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 88}
                        initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - progress) }}
                        transition={{ duration: 0.5 }}
                    />
                </svg>

                <div className="flex flex-col items-center z-10">
                    <div className="text-5xl font-black font-mono tracking-wider tabular-nums">
                        {formatTime(timeLeft)}
                    </div>
                    <div className="text-sm font-medium text-zinc-500 mt-2 flex items-center gap-1">
                        <CurrentIcon size={14} />
                        {isActive ? 'Running' : 'Paused'}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 w-full px-8">
                <button
                    onClick={toggleTimer}
                    className="flex-1 py-3 rounded-xl font-bold text-white transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    style={{ backgroundColor: MODES[mode].color, boxShadow: `0 8px 20px -6px ${MODES[mode].color}55` }}
                >
                    {isActive ? <Pause size={20} /> : <Play size={20} />}
                    {isActive ? 'Pause' : 'Start'}
                </button>
                <button
                    onClick={resetTimer}
                    className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                    <RotateCcw size={20} />
                </button>
            </div>

            {/* Session Stats */}
            <div className="mt-6 flex items-center gap-2 text-xs text-zinc-400">
                <span>Completed today:</span>
                <div className="flex gap-1">
                    {[...Array(Math.min(4, sessionCount))].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 rounded-full bg-red-500"
                        />
                    ))}
                    {sessionCount > 4 && <span>+{sessionCount - 4}</span>}
                </div>
            </div>
        </div>
    );
}
