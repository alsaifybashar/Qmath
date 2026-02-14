'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { generateStudyPlan } from '@/app/actions/ai';
import { Sparkles, CheckCircle, Target, Trophy, Clock, Brain } from 'lucide-react';

interface StudyPlanProps {
    courseName: string;
    courseCode: string;
    topics: string[];
    exams: Array<{ filePath: string; year: string; type: string }>;
}

interface AIResponse {
    areas: Array<{
        name: string;
        importance: number;
        reasoning: string;
        recommended_focus: string;
        estimated_frequency?: string;
    }>;
    study_schedule: Array<{
        week: number;
        focus: string;
        activity: string;
    }>;
    strategy: string;
}

export default function StudyPlan({ courseName, courseCode, topics, exams }: StudyPlanProps) {
    const [loading, setLoading] = useState(true);
    const [analyzingStep, setAnalyzingStep] = useState(0);
    const [plan, setPlan] = useState<AIResponse | null>(null);

    useEffect(() => {
        // Simulate analysis steps before fetching AI
        const steps = [
            "Connecting to neural network...",
            `Reading ${exams.length} recent ${courseCode} exams...`,
            "Analyzing question patterns...",
            "Identifying critical topics...",
            "Generating optimal strategy..."
        ];

        let stepIndex = 0;
        const interval = setInterval(() => {
            if (stepIndex < steps.length - 1) {
                stepIndex++;
                setAnalyzingStep(stepIndex);
            }
        }, 800);

        // Fetch AI Plan with real exam data
        generateStudyPlan(courseName, courseCode, topics, exams).then((res) => {
            // Add a small delay for "wow" effect (faked processing time if AI is too fast)
            setTimeout(() => {
                setPlan(res as AIResponse);
                setLoading(false);
                clearInterval(interval);
            }, 2000);
        });

        return () => clearInterval(interval);
    }, [courseName, courseCode, topics, exams]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
                <div className="relative w-24 h-24 mb-6">
                    <motion.div
                        className="absolute inset-0 border-4 border-blue-500/30 rounded-full"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute inset-0 border-4 border-t-blue-600 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <motion.div
                    key={analyzingStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-lg font-medium text-gray-600 dark:text-gray-300"
                >
                    {["Connecting...", `Scanning ${courseCode} exams...`, "Analyzing patterns...", "Identifying topics...", "Finalizing strategy..."][analyzingStep]}
                </motion.div>
                <div className="mt-2 text-sm text-gray-400">Powered by Claude 3.5 Sonnet</div>
            </div>
        );
    }

    if (!plan) return <div className="text-red-500">Failed to generate study plan.</div>;

    // Prepare data for charts
    const chartData = plan.areas.map(area => ({
        subject: area.name,
        A: area.importance,
        fullMark: 10,
    }));

    // Check if chartData is valid, otherwise use default
    const validChartData = chartData.length > 0 ? chartData : [
        { subject: 'Topic A', A: 8, fullMark: 10 },
        { subject: 'Topic B', A: 5, fullMark: 10 },
        { subject: 'Topic C', A: 10, fullMark: 10 },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            {/* Strategy Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <Trophy className="w-8 h-8 text-yellow-300" />
                        <h2 className="text-2xl font-bold">Recommended Winning Strategy</h2>
                    </div>
                    <p className="text-lg text-blue-100 leading-relaxed max-w-3xl">
                        {plan.strategy}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Visual Importance Chart */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-6">
                        <Target className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-bold">Topic Importance Radar</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={validChartData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                <Radar
                                    name="Importance"
                                    dataKey="A"
                                    stroke="#4f46e5"
                                    strokeWidth={3}
                                    fill="#6366f1"
                                    fillOpacity={0.5}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', borderColor: '#e5e7eb' }}
                                    formatter={(value: number | undefined) => [`${value ?? 0}/10`, 'Importance']}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Priority Topics List */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-6">
                        <Brain className="w-5 h-5 text-purple-500" />
                        <h3 className="text-lg font-bold">Priority Areas Breakdown</h3>
                    </div>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {plan.areas.sort((a, b) => b.importance - a.importance).map((area, idx) => (
                            <div key={idx} className="group p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-white border border-transparent hover:border-zinc-200 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{area.name}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${area.importance >= 8 ? 'bg-red-100 text-red-600' :
                                        area.importance >= 5 ? 'bg-yellow-100 text-yellow-600' :
                                            'bg-green-100 text-green-600'
                                        }`}>
                                        {area.importance}/10
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">{area.reasoning}</p>
                                <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                    Focus: {area.recommended_focus}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Study Schedule */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-bold">Suggested Study Timeline</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plan.study_schedule.map((slot, idx) => (
                        <div key={idx} className="relative p-5 rounded-xl border border-zinc-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="absolute top-4 right-4 text-xs font-bold text-zinc-300">WEEK {slot.week}</div>
                            <h4 className="font-bold text-lg mb-2 text-zinc-800">{slot.focus}</h4>
                            <div className="flex items-start gap-2 text-sm text-zinc-600">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{slot.activity}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
