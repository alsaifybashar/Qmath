'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer } from 'recharts';
import { generateStudyPlan } from '@/app/actions/ai';
import type { StudyPlanResult } from '@/app/actions/ai';
import { Sparkles, CheckCircle, Target, Trophy, Clock, Brain, Zap, AlertTriangle } from 'lucide-react';

// ============ TYPES ============

interface StudyPlanProps {
    courseName: string;
    courseCode: string;
    topics: string[];
    exams: Array<{ filePath: string; solutionFilePath?: string | null; year: string; type: string }>;
}

// ============ COMPONENT ============

export default function StudyPlan({ courseName, courseCode, topics, exams }: StudyPlanProps) {
    const [loading, setLoading] = useState(true);
    const [stepIndex, setStepIndex] = useState(0);
    const [plan, setPlan] = useState<StudyPlanResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Memoize exam data to prevent infinite re-render loops
    const stableExams = useMemo(() => exams, [JSON.stringify(exams)]);
    const stableTopics = useMemo(() => topics, [JSON.stringify(topics)]);

    const steps = [
        'Connecting to AI engine...',
        `Loading ${stableExams.length} exam PDF${stableExams.length !== 1 ? 's' : ''}...`,
        'Analyzing question patterns...',
        'Mapping topic frequency...',
        'Building study roadmap...',
    ];

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;
        let cancelled = false;

        // Animate loading steps
        intervalId = setInterval(() => {
            setStepIndex(prev => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 1200);

        // Call AI
        generateStudyPlan(courseName, courseCode, stableTopics, stableExams)
            .then((res) => {
                if (cancelled) return;
                // Minimum 2s display for the loading animation
                setTimeout(() => {
                    setPlan(res);
                    setLoading(false);
                    clearInterval(intervalId);
                }, 2000);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err?.message || 'Unknown error');
                setLoading(false);
                clearInterval(intervalId);
            });

        return () => {
            cancelled = true;
            clearInterval(intervalId);
        };
    }, [courseName, courseCode, stableTopics, stableExams]);

    // ======== LOADING STATE ========
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
                <div className="relative w-24 h-24 mb-6">
                    <motion.div
                        className="absolute inset-0 border-4 border-blue-500/30 rounded-full"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute inset-0 border-4 border-t-blue-600 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <motion.p
                    key={stepIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg font-medium text-gray-600"
                >
                    {steps[stepIndex]}
                </motion.p>
                <p className="mt-2 text-sm text-gray-400">Powered by Claude AI</p>
            </div>
        );
    }

    // ======== ERROR STATE ========
    if (error || !plan) {
        return (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
                <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-red-600 font-medium">Failed to generate study plan</p>
                <p className="text-red-400 text-sm mt-1">{error || 'No response from AI.'}</p>
            </div>
        );
    }

    // ======== SORT AREAS ========
    const sortedAreas = [...plan.areas].sort((a, b) => b.importance - a.importance);
    const radarData = sortedAreas.map(a => ({ subject: a.name, value: a.importance, fullMark: 10 }));

    // ======== RESULT UI ========
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
                {plan.cached && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5">
                        <Zap size={12} />
                        Cached — generated {new Date(plan.generatedAt).toLocaleDateString()}
                    </div>
                )}
                {plan.examsAnalyzed > 0 && (
                    <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5">
                        <Sparkles size={12} />
                        {plan.examsAnalyzed} exam PDF{plan.examsAnalyzed > 1 ? 's' : ''} analyzed by AI
                    </div>
                )}
            </div>

            {/* Strategy Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <Trophy className="w-7 h-7 text-yellow-300" />
                        <h2 className="text-2xl font-bold">Your Study Strategy</h2>
                    </div>
                    <p className="text-lg text-blue-100 leading-relaxed max-w-4xl">
                        {plan.strategy}
                    </p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Radar Chart */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-5">
                        <Target className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-bold text-gray-800">Topic Importance Map</h3>
                    </div>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                <Radar name="Importance" dataKey="value" stroke="#4f46e5" strokeWidth={2.5} fill="#6366f1" fillOpacity={0.4} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 13 }}
                                    formatter={(value: number | undefined) => [`${value ?? 0}/10`, 'Importance']}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Priority List */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-5">
                        <Brain className="w-5 h-5 text-purple-500" />
                        <h3 className="text-lg font-bold text-gray-800">Priority Breakdown</h3>
                    </div>
                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                        {sortedAreas.map((area, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 transition-all">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="font-semibold text-gray-800 text-sm">{area.name}</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${area.importance >= 8 ? 'bg-red-100 text-red-600' :
                                        area.importance >= 5 ? 'bg-amber-100 text-amber-600' :
                                            'bg-green-100 text-green-600'
                                        }`}>
                                        {area.importance}/10
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">{area.reasoning}</p>
                                {/* Importance bar */}
                                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${area.importance >= 8 ? 'bg-red-400' :
                                            area.importance >= 5 ? 'bg-amber-400' :
                                                'bg-green-400'
                                            }`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${area.importance * 10}%` }}
                                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Study Schedule */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                    <Clock className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-bold text-gray-800">Recommended Study Timeline</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {plan.study_schedule.map((slot, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className="relative p-5 rounded-xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow"
                        >
                            <div className="absolute top-4 right-4 text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                                Week {slot.week}
                            </div>
                            <h4 className="font-bold text-base mb-2 text-gray-800 pr-12">{slot.focus}</h4>
                            <div className="flex items-start gap-2 text-sm text-gray-500">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{slot.activity}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
