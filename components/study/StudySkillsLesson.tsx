'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, BookOpen, Clock } from 'lucide-react';
import type { StudySkillsLesson as LessonType } from '@/lib/content/study-skills-content';
import { motionDuration } from '@/lib/motion';

interface StudySkillsLessonProps {
    lesson: LessonType;
    onComplete: () => void;
    onDismiss?: () => void;
}

/**
 * Study Skills Micro-Lesson Viewer
 *
 * Shows brief interactive lessons about effective study strategies.
 * Research: a 20-minute study skills discussion improved high-anxiety
 * students by half a letter grade.
 */
export function StudySkillsLessonViewer({
    lesson,
    onComplete,
    onDismiss,
}: StudySkillsLessonProps) {
    const [currentSection, setCurrentSection] = useState(0);
    const reduceMotion = useReducedMotion();
    const section = lesson.sections[currentSection];
    const isLast = currentSection === lesson.sections.length - 1;

    const handleNext = () => {
        if (isLast) {
            onComplete();
        } else {
            setCurrentSection(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentSection > 0) {
            setCurrentSection(prev => prev - 1);
        }
    };

    // Section type colors
    const sectionStyles = {
        text: 'bg-blue-50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/15',
        tip: 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/15',
        myth_fact: 'bg-purple-50 dark:bg-purple-500/5 border-purple-200 dark:border-purple-500/15',
        interactive: 'bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/15',
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : motionDuration.correct }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden max-w-md mx-auto shadow-xl"
        >
            {/* Header */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                            {lesson.titleSv}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <Clock className="w-3 h-3" />
                            {lesson.durationMinutes} min
                        </div>
                    </div>
                </div>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5 px-4 pt-4 justify-center">
                {lesson.sections.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1 rounded-full transition-all ${
                            i <= currentSection
                                ? 'w-8 bg-blue-500'
                                : 'w-4 bg-zinc-200 dark:bg-zinc-700'
                        }`}
                    />
                ))}
            </div>

            {/* Section content */}
            <div className="p-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSection}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : motionDuration.correct }}
                    >
                        <div className={`p-5 rounded-xl border ${sectionStyles[section.type]}`}>
                            {section.emoji && (
                                <span className="text-3xl block mb-3">{section.emoji}</span>
                            )}
                            {section.titleSv && (
                                <h4 className="font-bold text-zinc-900 dark:text-white mb-2">
                                    {section.titleSv}
                                </h4>
                            )}
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                                {section.contentSv}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="p-4 pt-0 flex items-center justify-between">
                <button
                    onClick={handlePrev}
                    disabled={currentSection === 0}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                        currentSection === 0
                            ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Tillbaka
                </button>

                <span className="text-xs text-zinc-400">
                    {currentSection + 1} / {lesson.sections.length}
                </span>

                <button
                    onClick={handleNext}
                    className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    {isLast ? 'Klar' : 'Nästa'}
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
