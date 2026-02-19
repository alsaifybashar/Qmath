'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

export interface MasteryTopic {
    id: string;
    name: string;
    masteryLevel: number; // 0-5
    totalAttempts: number;
    correctAttempts: number;
    category?: string;
}

interface MasteryRadarProps {
    topics: MasteryTopic[];
    maxTopicsToShow?: number;
}

// ============================================================================
// MASTERY RADAR COMPONENT
// ============================================================================

export default function MasteryRadar({ topics, maxTopicsToShow = 8 }: MasteryRadarProps) {
    const [viewMode, setViewMode] = useState<'radar' | 'grid'>('grid');
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

    // Get top topics by activity
    const displayTopics = useMemo(() => {
        return topics
            .sort((a, b) => b.totalAttempts - a.totalAttempts)
            .slice(0, maxTopicsToShow);
    }, [topics, maxTopicsToShow]);

    // Calculate insights
    const insights = useMemo(() => {
        if (topics.length === 0) return null;

        const avgMastery = topics.reduce((sum, t) => sum + t.masteryLevel, 0) / topics.length;
        const mastered = topics.filter(t => t.masteryLevel >= 4);
        const needsWork = topics.filter(t => t.masteryLevel <= 1);
        const learning = topics.filter(t => t.masteryLevel > 1 && t.masteryLevel < 4);

        // Find strongest and weakest
        const strongest = topics.reduce((a, b) => a.masteryLevel > b.masteryLevel ? a : b);
        const weakest = topics.reduce((a, b) => a.masteryLevel < b.masteryLevel ? a : b);

        return {
            avgMastery,
            mastered: mastered.length,
            needsWork: needsWork.length,
            learning: learning.length,
            strongest,
            weakest,
        };
    }, [topics]);

    if (topics.length === 0) {
        return <EmptyState />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        >
            {/* Header */}
            <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <span className="text-xl">📊</span>
                        </motion.div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Ämnesbemästring</h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {topics.length} ämnen spårade
                            </p>
                        </div>
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'grid'
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            Rutnät
                        </button>
                        <button
                            onClick={() => setViewMode('radar')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'radar'
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            Radar
                        </button>
                    </div>
                </div>

                {/* Summary stats */}
                {insights && (
                    <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200/50 dark:border-green-700/30">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{insights.mastered}</div>
                            <div className="text-xs text-green-700 dark:text-green-300">Bemästrade</div>
                        </div>
                        <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200/50 dark:border-amber-700/30">
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{insights.learning}</div>
                            <div className="text-xs text-amber-700 dark:text-amber-300">Lärande</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200/50 dark:border-red-700/30">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{insights.needsWork}</div>
                            <div className="text-xs text-red-700 dark:text-red-300">Behöver arbete</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mastery visualization */}
            <div className="px-6 pb-4">
                {viewMode === 'grid' ? (
                    <SkillGrid
                        topics={displayTopics}
                        selectedTopic={selectedTopic}
                        onSelectTopic={setSelectedTopic}
                    />
                ) : (
                    <RadarChart topics={displayTopics.slice(0, 6)} />
                )}
            </div>

            {/* AI Insight */}
            {insights && (
                <div className="px-6 pb-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/30"
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-lg">💡</span>
                            <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                <strong>{insights.strongest.name}</strong> är ditt starkaste ämne.
                                {insights.needsWork > 0 && (
                                    <> Fokusera på <strong>{insights.weakest.name}</strong> för att balansera dina färdigheter.</>
                                )}
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}

// ============================================================================
// SKILL GRID COMPONENT
// ============================================================================

function SkillGrid({
    topics,
    selectedTopic,
    onSelectTopic
}: {
    topics: MasteryTopic[];
    selectedTopic: string | null;
    onSelectTopic: (id: string | null) => void;
}) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {topics.map((topic, index) => (
                <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    onClick={() => onSelectTopic(selectedTopic === topic.id ? null : topic.id)}
                    className={`relative cursor-pointer p-4 rounded-xl border transition-all ${selectedTopic === topic.id
                        ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg'
                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600'
                        }`}
                >
                    {/* Mastery ring */}
                    <div className="flex justify-center mb-3">
                        <MasteryRing level={topic.masteryLevel} size={60} />
                    </div>

                    {/* Topic name */}
                    <h4 className="text-sm font-semibold text-center text-zinc-900 dark:text-white truncate mb-1">
                        {topic.name}
                    </h4>

                    {/* Accuracy */}
                    <div className="text-xs text-center text-zinc-500 dark:text-zinc-400">
                        {topic.totalAttempts > 0
                            ? `${Math.round((topic.correctAttempts / topic.totalAttempts) * 100)}% träffsäkerhet`
                            : 'Inga försök än'
                        }
                    </div>

                    {/* Practice link on selection */}
                    {selectedTopic === topic.id && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3"
                        >
                            <Link
                                href={`/practice/${topic.id}`}
                                className="block w-full text-center text-xs font-medium px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Öva →
                            </Link>
                        </motion.div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}

// ============================================================================
// MASTERY RING COMPONENT
// ============================================================================

function MasteryRing({ level, size = 60 }: { level: number; size?: number }) {
    const percentage = (level / 5) * 100;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const getColor = (level: number) => {
        if (level >= 4) return { stroke: '#10b981', bg: '#d1fae5', text: '#059669' }; // Green
        if (level >= 3) return { stroke: '#f59e0b', bg: '#fef3c7', text: '#d97706' }; // Amber
        if (level >= 2) return { stroke: '#f97316', bg: '#ffedd5', text: '#ea580c' }; // Orange
        return { stroke: '#ef4444', bg: '#fee2e2', text: '#dc2626' }; // Red
    };

    const colors = getColor(level);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-zinc-200 dark:text-zinc-700"
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                />
            </svg>
            {/* Center text */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ color: colors.text }}
            >
                <span className="text-sm font-bold">{level}/5</span>
            </div>
        </div>
    );
}

// ============================================================================
// RADAR CHART COMPONENT (Simple SVG implementation)
// ============================================================================

function RadarChart({ topics }: { topics: MasteryTopic[] }) {
    if (topics.length < 3) {
        return (
            <div className="text-center py-8 text-zinc-500">
                Behöver minst 3 ämnen för radarvy
            </div>
        );
    }

    const size = 280;
    const center = size / 2;
    const maxRadius = 100;
    const levels = 5;

    // Calculate points for each topic
    const angleStep = (2 * Math.PI) / topics.length;
    const dataPoints = topics.map((topic, i) => {
        const angle = i * angleStep - Math.PI / 2; // Start from top
        const radius = (topic.masteryLevel / 5) * maxRadius;
        return {
            x: center + radius * Math.cos(angle),
            y: center + radius * Math.sin(angle),
            angle,
            topic,
        };
    });

    // Create polygon path
    const polygonPath = dataPoints.map((p, i) =>
        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ') + ' Z';

    return (
        <div className="flex justify-center">
            <svg width={size} height={size} className="overflow-visible">
                {/* Background circles */}
                {[...Array(levels)].map((_, i) => (
                    <circle
                        key={i}
                        cx={center}
                        cy={center}
                        r={(maxRadius / levels) * (i + 1)}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1}
                        className="text-zinc-200 dark:text-zinc-700"
                    />
                ))}

                {/* Axis lines */}
                {topics.map((_, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    const x = center + maxRadius * Math.cos(angle);
                    const y = center + maxRadius * Math.sin(angle);
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={x}
                            y2={y}
                            stroke="currentColor"
                            strokeWidth={1}
                            className="text-zinc-200 dark:text-zinc-700"
                        />
                    );
                })}

                {/* Data polygon */}
                <motion.path
                    d={polygonPath}
                    fill="rgba(59, 130, 246, 0.2)"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth={2}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: `${center}px ${center}px` }}
                />

                {/* Data points */}
                {dataPoints.map((p, i) => (
                    <motion.circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={5}
                        fill="rgb(59, 130, 246)"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                    />
                ))}

                {/* Labels */}
                {dataPoints.map((p, i) => {
                    const labelRadius = maxRadius + 25;
                    const labelX = center + labelRadius * Math.cos(p.angle);
                    const labelY = center + labelRadius * Math.sin(p.angle);
                    return (
                        <text
                            key={i}
                            x={labelX}
                            y={labelY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-xs fill-zinc-600 dark:fill-zinc-400 font-medium"
                        >
                            {p.topic.name.length > 10 ? p.topic.name.slice(0, 10) + '...' : p.topic.name}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center"
        >
            <div className="text-5xl mb-4">📈</div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                Ingen data än
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                Börja öva för att se dina färdigheter visualiserade här!
            </p>
            <Link
                href="/practice"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
                Börja lär
                <span>→</span>
            </Link>
        </motion.div>
    );
}
