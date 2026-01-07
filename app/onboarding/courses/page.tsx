'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const courses = [
    { id: 'calc1', name: 'Calculus I', code: 'SF1625', topics: 24, difficulty: 'Foundation' },
    { id: 'calc2', name: 'Calculus II', code: 'SF1626', topics: 28, difficulty: 'Intermediate' },
    { id: 'calc3', name: 'Calculus III', code: 'SF1672', topics: 22, difficulty: 'Advanced' },
    { id: 'linalg', name: 'Linear Algebra', code: 'SF1624', topics: 18, difficulty: 'Foundation' },
    { id: 'diffeq', name: 'Differential Equations', code: 'SF1633', topics: 20, difficulty: 'Intermediate' },
    { id: 'complex', name: 'Complex Analysis', code: 'SF1629', topics: 16, difficulty: 'Advanced' },
    { id: 'stats', name: 'Probability & Statistics', code: 'SF1901', topics: 22, difficulty: 'Intermediate' },
    { id: 'physics1', name: 'Mechanics', code: 'SG1113', topics: 26, difficulty: 'Foundation' },
    { id: 'physics2', name: 'Electromagnetism', code: 'SG1114', topics: 24, difficulty: 'Intermediate' }
];

export default function OnboardingCourses() {
    const router = useRouter();
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

    const toggleCourse = (id: string) => {
        setSelectedCourses(prev =>
            prev.includes(id)
                ? prev.filter(c => c !== id)
                : [...prev, id]
        );
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gradient-to-br from-orange-900/20 via-black to-purple-900/20"></div>
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 max-w-2xl w-full"
            >
                <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 md:p-12">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                            <BookOpen className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Select your courses</h1>
                            <p className="text-zinc-400">Which courses are you taking?</p>
                        </div>
                    </div>

                    {/* Selection count */}
                    <div className="mb-6 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Selected courses</span>
                            <span className="font-bold text-orange-400">{selectedCourses.length} courses</span>
                        </div>
                    </div>

                    {/* Course Grid */}
                    <div className="grid gap-3 max-h-[350px] overflow-y-auto mb-8 pr-2">
                        {courses.map((course) => {
                            const isSelected = selectedCourses.includes(course.id);
                            return (
                                <motion.button
                                    key={course.id}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => toggleCourse(course.id)}
                                    className={`w-full p-4 rounded-xl border text-left transition-all ${isSelected
                                        ? 'bg-orange-500/10 border-orange-500'
                                        : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                                ? 'bg-orange-500 border-orange-500'
                                                : 'border-zinc-600'
                                                }`}>
                                                {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white">{course.name}</div>
                                                <div className="text-sm text-zinc-400">{course.code}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-zinc-500">{course.topics} topics</div>
                                            <div className={`text-xs px-2 py-0.5 rounded mt-1 ${course.difficulty === 'Foundation'
                                                ? 'bg-green-500/20 text-green-400'
                                                : course.difficulty === 'Intermediate'
                                                    ? 'bg-yellow-500/20 text-yellow-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {course.difficulty}
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.push('/onboarding/program')}
                            className="flex items-center gap-2 px-6 py-3 text-zinc-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back
                        </button>
                        <button
                            onClick={() => selectedCourses.length > 0 && router.push('/onboarding/complete')}
                            disabled={selectedCourses.length === 0}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${selectedCourses.length > 0
                                ? 'bg-orange-600 hover:bg-orange-500 text-white'
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                }`}
                        >
                            Continue
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Progress */}
                <div className="flex justify-center gap-2 mt-8">
                    <div className="w-8 h-1 rounded-full bg-blue-500"></div>
                    <div className="w-8 h-1 rounded-full bg-blue-500"></div>
                    <div className="w-8 h-1 rounded-full bg-green-500"></div>
                    <div className="w-8 h-1 rounded-full bg-orange-500"></div>
                    <div className="w-8 h-1 rounded-full bg-zinc-700"></div>
                </div>
            </motion.div>
        </div>
    );
}
