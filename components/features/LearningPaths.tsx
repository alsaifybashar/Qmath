'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Lock, Unlock, CheckCircle2, Circle, ChevronRight, Sparkles, BookOpen, Play, Trophy } from 'lucide-react';
import Link from 'next/link';

// Types
export interface LearningNode {
    id: string;
    title: string;
    description: string;
    type: 'theory' | 'examples' | 'practice' | 'assessment';
    status: 'locked' | 'available' | 'in_progress' | 'completed';
    xpReward: number;
    estimatedMinutes: number;
    masteryLevel?: number; // 0-100
    prerequisites?: string[];
}

export interface LearningPath {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: 'blue' | 'purple' | 'green' | 'orange' | 'pink';
    nodes: LearningNode[];
    totalXP: number;
    completedXP: number;
}

interface LearningPathsProps {
    paths: LearningPath[];
}

// Color mappings
const colorMap = {
    blue: {
        bg: 'bg-blue-500',
        bgLight: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-600 dark:text-blue-400',
        glow: 'shadow-blue-500/30',
        gradient: 'from-blue-500 to-cyan-500'
    },
    purple: {
        bg: 'bg-purple-500',
        bgLight: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-600 dark:text-purple-400',
        glow: 'shadow-purple-500/30',
        gradient: 'from-purple-500 to-pink-500'
    },
    green: {
        bg: 'bg-emerald-500',
        bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: 'border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-600 dark:text-emerald-400',
        glow: 'shadow-emerald-500/30',
        gradient: 'from-emerald-500 to-teal-500'
    },
    orange: {
        bg: 'bg-orange-500',
        bgLight: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800',
        text: 'text-orange-600 dark:text-orange-400',
        glow: 'shadow-orange-500/30',
        gradient: 'from-orange-500 to-red-500'
    },
    pink: {
        bg: 'bg-pink-500',
        bgLight: 'bg-pink-50 dark:bg-pink-900/20',
        border: 'border-pink-200 dark:border-pink-800',
        text: 'text-pink-600 dark:text-pink-400',
        glow: 'shadow-pink-500/30',
        gradient: 'from-pink-500 to-rose-500'
    }
};

const nodeTypeIcons = {
    theory: BookOpen,
    examples: Sparkles,
    practice: Play,
    assessment: Trophy
};

export default function LearningPaths({ paths }: LearningPathsProps) {
    const [expandedPath, setExpandedPath] = useState<string | null>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Learning Paths</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Master topics in structured progression</p>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full border border-purple-200 dark:border-purple-800"
                >
                    <Trophy className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {paths.reduce((acc, p) => acc + p.completedXP, 0)} XP Earned
                    </span>
                </motion.div>
            </div>

            {/* Path Cards */}
            <div className="space-y-4">
                {paths.map((path, pathIndex) => {
                    const colors = colorMap[path.color];
                    const isExpanded = expandedPath === path.id;
                    const progress = (path.completedXP / path.totalXP) * 100;
                    const completedNodes = path.nodes.filter(n => n.status === 'completed').length;

                    return (
                        <motion.div
                            key={path.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: pathIndex * 0.1 }}
                            className={`rounded-2xl border ${colors.border} ${colors.bgLight} overflow-hidden`}
                        >
                            {/* Path Header */}
                            <motion.button
                                onClick={() => setExpandedPath(isExpanded ? null : path.id)}
                                className="w-full p-5 flex items-center gap-4 text-left hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors"
                            >
                                {/* Icon */}
                                <motion.div
                                    whileHover={{ rotate: 10 }}
                                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-2xl shadow-lg ${colors.glow}`}
                                >
                                    {path.icon}
                                </motion.div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{path.title}</h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{path.description}</p>

                                    {/* Progress bar */}
                                    <div className="mt-2 flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-white/50 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                                className={`h-full bg-gradient-to-r ${colors.gradient}`}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-zinc-500">
                                            {completedNodes}/{path.nodes.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Expand indicator */}
                                <motion.div
                                    animate={{ rotate: isExpanded ? 90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronRight className="w-5 h-5 text-zinc-400" />
                                </motion.div>
                            </motion.button>

                            {/* Nodes Tree */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 pb-5 pt-2">
                                            <div className="relative">
                                                {/* Connection line */}
                                                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-zinc-200 via-zinc-300 to-zinc-200 dark:from-zinc-700 dark:via-zinc-600 dark:to-zinc-700" />

                                                {/* Nodes */}
                                                <div className="space-y-3">
                                                    {path.nodes.map((node, nodeIndex) => (
                                                        <NodeCard
                                                            key={node.id}
                                                            node={node}
                                                            index={nodeIndex}
                                                            pathColor={path.color}
                                                            isHovered={hoveredNode === node.id}
                                                            onHover={() => setHoveredNode(node.id)}
                                                            onLeave={() => setHoveredNode(null)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

// Individual Node Card
function NodeCard({
    node,
    index,
    pathColor,
    isHovered,
    onHover,
    onLeave
}: {
    node: LearningNode;
    index: number;
    pathColor: 'blue' | 'purple' | 'green' | 'orange' | 'pink';
    isHovered: boolean;
    onHover: () => void;
    onLeave: () => void;
}) {
    const colors = colorMap[pathColor];
    const Icon = nodeTypeIcons[node.type];
    const isLocked = node.status === 'locked';
    const isCompleted = node.status === 'completed';
    const isAvailable = node.status === 'available' || node.status === 'in_progress';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            className="relative pl-12"
        >
            {/* Node indicator on timeline */}
            <motion.div
                animate={isHovered ? { scale: 1.2 } : { scale: 1 }}
                className={`absolute left-4 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 ${isCompleted
                        ? `${colors.bg} border-transparent`
                        : isLocked
                            ? 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600'
                            : `bg-white dark:bg-zinc-900 ${colors.border}`
                    }`}
            >
                {isCompleted ? (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                ) : isLocked ? (
                    <Lock className="w-2.5 h-2.5 text-zinc-400" />
                ) : (
                    <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`w-2 h-2 rounded-full ${colors.bg}`}
                    />
                )}
            </motion.div>

            {/* Card content */}
            <Link
                href={isLocked ? '#' : `/learn/${node.id}`}
                className={`block p-4 rounded-xl border transition-all duration-200 ${isLocked
                        ? 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 opacity-60 cursor-not-allowed'
                        : isCompleted
                            ? `bg-white dark:bg-zinc-800 ${colors.border} shadow-sm`
                            : `bg-white dark:bg-zinc-800 ${colors.border} hover:shadow-lg hover:-translate-y-0.5 ${colors.glow}`
                    }`}
            >
                <div className="flex items-start gap-3">
                    {/* Type icon */}
                    <div className={`p-2 rounded-lg ${isLocked ? 'bg-zinc-200 dark:bg-zinc-700' : colors.bgLight}`}>
                        <Icon className={`w-4 h-4 ${isLocked ? 'text-zinc-400' : colors.text}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-semibold ${isLocked ? 'text-zinc-400' : 'text-zinc-900 dark:text-white'}`}>
                                {node.title}
                            </h4>
                            {isCompleted && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full"
                                >
                                    ✓ Done
                                </motion.span>
                            )}
                        </div>
                        <p className={`text-sm ${isLocked ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                            {node.description}
                        </p>

                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-zinc-400">~{node.estimatedMinutes} min</span>
                            <span className={`text-xs font-medium ${colors.text}`}>+{node.xpReward} XP</span>
                            {node.masteryLevel !== undefined && isCompleted && (
                                <span className="text-xs text-green-600 dark:text-green-400">
                                    {node.masteryLevel}% mastery
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Unlock animation for available nodes */}
                    {isAvailable && !isCompleted && (
                        <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            <ChevronRight className={`w-5 h-5 ${colors.text}`} />
                        </motion.div>
                    )}
                </div>
            </Link>
        </motion.div>
    );
}
