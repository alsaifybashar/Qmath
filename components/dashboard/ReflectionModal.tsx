'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Brain, Calculator, Eye, Clock, FileQuestion, HelpCircle } from 'lucide-react';
import { classifyError } from '@/app/actions/analytics';

interface ReflectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    attempt: {
        id: string; // Required
        timestamp: Date | string;
    };
}

const ERROR_TYPES = [
    { id: 'conceptual', label: 'Conceptual', icon: Brain, color: '#f59e0b', desc: 'I didn\'t understand the concept' },
    { id: 'procedural', label: 'Procedural', icon: FileQuestion, color: '#3b82f6', desc: 'I used the wrong method' },
    { id: 'computational', label: 'Calculation', icon: Calculator, color: '#ef4444', desc: 'I made a math error' },
    { id: 'interpretation', label: 'Misread', icon: Eye, color: '#8b5cf6', desc: 'I misread the question' },
    { id: 'time_pressure', label: 'Time', icon: Clock, color: '#6366f1', desc: 'I ran out of time' },
    { id: 'other', label: 'Other', icon: HelpCircle, color: '#9ca3af', desc: 'Something else' },
];

export default function ReflectionModal({ isOpen, onClose, attempt }: ReflectionModalProps) {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [reflection, setReflection] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedType) return;
        setIsSubmitting(true);
        try {
            await classifyError(attempt.id, selectedType, reflection);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                        <h3 className="font-bold text-lg">Analyze Your Mistake</h3>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                        <p className="text-zinc-500 mb-4 text-sm">
                            Mistakes are opportunities to learn. What went wrong on this question?
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {ERROR_TYPES.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedType(type.id)}
                                    className={`p-3 rounded-xl border text-left transition-all ${selectedType === type.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-1 ring-blue-500'
                                            : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1" style={{ color: type.color }}>
                                        <type.icon size={18} />
                                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{type.label}</span>
                                    </div>
                                    <div className="text-xs text-zinc-500">{type.desc}</div>
                                </button>
                            ))}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">Reflection (Optional)</label>
                            <textarea
                                value={reflection}
                                onChange={(e) => setReflection(e.target.value)}
                                placeholder="What will you do differently next time?"
                                className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!selectedType || isSubmitting}
                            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? 'Saving...' : (
                                <>
                                    <Check size={18} />
                                    Save Analysis
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
