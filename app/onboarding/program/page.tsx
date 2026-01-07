'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const programs = [
    { id: 'civil', name: 'Civil Engineering', duration: '5 years', icon: '🏗️' },
    { id: 'electrical', name: 'Electrical Engineering', duration: '5 years', icon: '⚡' },
    { id: 'mechanical', name: 'Mechanical Engineering', duration: '5 years', icon: '⚙️' },
    { id: 'computer', name: 'Computer Science', duration: '5 years', icon: '💻' },
    { id: 'physics', name: 'Engineering Physics', duration: '5 years', icon: '🔬' },
    { id: 'chemical', name: 'Chemical Engineering', duration: '5 years', icon: '🧪' },
    { id: 'industrial', name: 'Industrial Engineering', duration: '5 years', icon: '📊' },
    { id: 'biotechnology', name: 'Biotechnology', duration: '5 years', icon: '🧬' },
    { id: 'materials', name: 'Materials Science', duration: '5 years', icon: '🔩' },
    { id: 'other', name: 'Other Program', duration: '', icon: '📚' }
];

export default function OnboardingProgram() {
    const router = useRouter();
    const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
    const [studyYear, setStudyYear] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gradient-to-br from-green-900/20 via-black to-blue-900/20"></div>
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 max-w-2xl w-full"
            >
                <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 md:p-12">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                            <GraduationCap className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Select your program</h1>
                            <p className="text-zinc-400">What are you studying?</p>
                        </div>
                    </div>

                    {/* Program Grid */}
                    <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto mb-8 pr-2">
                        {programs.map((program) => (
                            <motion.button
                                key={program.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedProgram(program.id)}
                                className={`p-4 rounded-xl border text-left transition-all ${selectedProgram === program.id
                                    ? 'bg-green-500/10 border-green-500'
                                    : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                                    }`}
                            >
                                <div className="text-2xl mb-2">{program.icon}</div>
                                <div className="font-semibold text-white text-sm">{program.name}</div>
                                {program.duration && (
                                    <div className="text-xs text-zinc-500 mt-1">{program.duration}</div>
                                )}
                            </motion.button>
                        ))}
                    </div>

                    {/* Study Year */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-zinc-400 mb-3">Which year are you in?</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((year) => (
                                <button
                                    key={year}
                                    onClick={() => setStudyYear(year)}
                                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${studyYear === year
                                        ? 'bg-green-500 text-white'
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                        }`}
                                >
                                    Year {year}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.push('/onboarding/university')}
                            className="flex items-center gap-2 px-6 py-3 text-zinc-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back
                        </button>
                        <button
                            onClick={() => selectedProgram && studyYear && router.push('/onboarding/courses')}
                            disabled={!selectedProgram || !studyYear}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${selectedProgram && studyYear
                                ? 'bg-green-600 hover:bg-green-500 text-white'
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
                    <div className="w-8 h-1 rounded-full bg-zinc-700"></div>
                    <div className="w-8 h-1 rounded-full bg-zinc-700"></div>
                </div>
            </motion.div>
        </div>
    );
}
