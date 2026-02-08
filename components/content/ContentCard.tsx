'use client';

/**
 * ContentCard Component
 * 
 * A versatile card component for displaying AI-generated content.
 * Supports all content types with type-specific rendering.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    Lightbulb,
    Puzzle,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Clock,
    Star,
    Zap
} from 'lucide-react';
import type { ContentType } from '@/db/content-schema';

// Types
export interface ContentCardProps {
    id: string;
    contentType: ContentType;
    title?: string;
    preview?: string;
    difficulty?: number;
    estimatedMinutes?: number;
    tags?: string[];
    onClick?: () => void;
    onStart?: () => void;
    isExpanded?: boolean;
    className?: string;
}

// Content type configurations
const contentTypeConfig: Record<ContentType, {
    label: string;
    icon: React.ReactNode;
    color: string;
    gradient: string;
    description: string;
}> = {
    'free_form_symbolic': {
        label: 'Free-Form Input',
        icon: <BookOpen className="w-5 h-5" />,
        color: 'purple',
        gradient: 'from-purple-500 to-indigo-500',
        description: 'Enter your answer as a mathematical expression'
    },
    'faded_worked_example': {
        label: 'Worked Example',
        icon: <Lightbulb className="w-5 h-5" />,
        color: 'amber',
        gradient: 'from-amber-500 to-orange-500',
        description: 'Learn step-by-step with scaffolded support'
    },
    'parsons_problem': {
        label: 'Parsons Problem',
        icon: <Puzzle className="w-5 h-5" />,
        color: 'blue',
        gradient: 'from-blue-500 to-cyan-500',
        description: 'Arrange proof steps in correct order'
    },
    'line_by_line': {
        label: 'Step Validation',
        icon: <BookOpen className="w-5 h-5" />,
        color: 'green',
        gradient: 'from-green-500 to-emerald-500',
        description: 'Verify each step of your solution'
    },
    'graphical_manipulation': {
        label: 'Interactive Graph',
        icon: <Zap className="w-5 h-5" />,
        color: 'pink',
        gradient: 'from-pink-500 to-rose-500',
        description: 'Manipulate visual elements to solve'
    },
    'counter_example': {
        label: 'Counter-Example',
        icon: <AlertTriangle className="w-5 h-5" />,
        color: 'red',
        gradient: 'from-red-500 to-orange-500',
        description: 'Find an example that disproves the statement'
    },
    'error_spotting': {
        label: 'Find the Error',
        icon: <AlertTriangle className="w-5 h-5" />,
        color: 'yellow',
        gradient: 'from-yellow-500 to-amber-500',
        description: 'Identify the mistake in the solution'
    },
    'confidence_tagged': {
        label: 'Confidence Check',
        icon: <Star className="w-5 h-5" />,
        color: 'violet',
        gradient: 'from-violet-500 to-purple-500',
        description: 'Rate your confidence before checking'
    },
};

// Difficulty indicator
function DifficultyIndicator({ level }: { level: number }) {
    const bars = 5;
    const filled = Math.ceil(level * bars);

    return (
        <div className="flex items-center gap-1">
            <span className="text-xs text-zinc-500 mr-1">Difficulty</span>
            <div className="flex gap-0.5">
                {[...Array(bars)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-1.5 h-3 rounded-sm transition-colors ${i < filled
                                ? level > 0.7
                                    ? 'bg-red-500'
                                    : level > 0.4
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                : 'bg-zinc-200 dark:bg-zinc-700'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}

export function ContentCard({
    id,
    contentType,
    title,
    preview,
    difficulty = 0.5,
    estimatedMinutes,
    tags = [],
    onClick,
    onStart,
    isExpanded: controlledExpanded,
    className = '',
}: ContentCardProps) {
    const [isExpandedLocal, setIsExpandedLocal] = useState(false);
    const isExpanded = controlledExpanded ?? isExpandedLocal;

    const config = contentTypeConfig[contentType] || contentTypeConfig['free_form_symbolic'];

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            setIsExpandedLocal(!isExpandedLocal);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
                group relative
                bg-white dark:bg-zinc-900
                border border-zinc-200 dark:border-zinc-800
                rounded-2xl overflow-hidden
                hover:border-zinc-300 dark:hover:border-zinc-700
                hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50
                transition-all duration-300
                ${className}
            `}
        >
            {/* Top gradient bar */}
            <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />

            {/* Main content */}
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`
                        flex-shrink-0 p-3 rounded-xl
                        bg-gradient-to-br ${config.gradient}
                        text-white shadow-lg
                    `}>
                        {config.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`
                                text-xs font-medium px-2 py-0.5 rounded-full
                                bg-${config.color}-100 dark:bg-${config.color}-900/30
                                text-${config.color}-700 dark:text-${config.color}-300
                            `}>
                                {config.label}
                            </span>
                            {estimatedMinutes && (
                                <span className="flex items-center gap-1 text-xs text-zinc-500">
                                    <Clock className="w-3 h-3" />
                                    {estimatedMinutes}min
                                </span>
                            )}
                        </div>

                        <h3 className="font-semibold text-lg text-zinc-900 dark:text-white truncate">
                            {title || `Problem #${id.slice(0, 8)}`}
                        </h3>

                        <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                            {preview || config.description}
                        </p>
                    </div>

                    {/* Expand toggle */}
                    <motion.button
                        onClick={handleClick}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex-shrink-0 p-2 rounded-lg
                                   hover:bg-zinc-100 dark:hover:bg-zinc-800
                                   text-zinc-400 transition-colors"
                    >
                        {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                        ) : (
                            <ChevronDown className="w-5 h-5" />
                        )}
                    </motion.button>
                </div>

                {/* Tags & Difficulty */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-wrap gap-2">
                        {tags.slice(0, 3).map((tag, i) => (
                            <span
                                key={i}
                                className="text-xs px-2 py-1 rounded-md
                                           bg-zinc-100 dark:bg-zinc-800
                                           text-zinc-600 dark:text-zinc-400"
                            >
                                {tag}
                            </span>
                        ))}
                        {tags.length > 3 && (
                            <span className="text-xs text-zinc-400">
                                +{tags.length - 3} more
                            </span>
                        )}
                    </div>

                    <DifficultyIndicator level={difficulty} />
                </div>
            </div>

            {/* Expanded content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-zinc-100 dark:border-zinc-800"
                    >
                        <div className="p-5">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                                {config.description}
                            </p>

                            <motion.button
                                onClick={onStart}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`
                                    w-full py-3 px-4 rounded-xl
                                    bg-gradient-to-r ${config.gradient}
                                    text-white font-medium
                                    hover:shadow-lg transition-shadow
                                `}
                            >
                                Start Problem
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default ContentCard;
