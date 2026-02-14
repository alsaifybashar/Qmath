'use client';

import { useState, useEffect, useTransition } from 'react';
import { getSuggestedCourses, saveUserCourses } from '@/app/actions/courses';
import { Loader2, Check, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Course {
    id: string;
    code: string;
    name: string;
    description: string;
}

export default function CourseSelectionPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [universityName, setUniversityName] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getSuggestedCourses().then((res) => {
            if (res.error) {
                setError(res.error);
            } else if (res.data) {
                setCourses(res.data as Course[]);
                setUniversityName(res.universityName || '');
                // Do NOT auto-select courses. Let the user choose what sparks joy.
                setSelected([]);
            }
            setLoading(false);
        });
    }, []);

    const toggleCourse = (id: string) => {
        if (selected.includes(id)) {
            setSelected(selected.filter(s => s !== id));
        } else {
            setSelected([...selected, id]);
        }
    };

    const handleSave = () => {
        if (selected.length === 0) {
            setError('Please select at least one course to start your journey.');
            return;
        }
        setError(null);
        startTransition(async () => {
            const result = await saveUserCourses(selected);
            if (result?.error) {
                setError(result.error);
            }
        });
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full animate-pulse"></div>
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 relative z-10" />
                    </div>
                    <p className="text-zinc-500 font-medium animate-pulse">Curating your courses...</p>
                </motion.div>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col items-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
            <div className="absolute top-20 right-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-4xl w-full space-y-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-center space-y-4 pt-10"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">
                        <Sparkles className="w-4 h-4" />
                        <span>Personalized Recommendations</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
                        What are you interested in?
                    </h1>
                    <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        Select the courses you plan to study. We've found these based on your program at <span className="font-semibold text-zinc-900 dark:text-white">{universityName}</span>.
                    </p>
                </motion.div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-6 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm"
                        >
                            <span className="font-medium">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    {courses.length === 0 ? (
                        <div className="col-span-2 text-center py-12 text-zinc-500 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                            No specific courses found for your program yet.
                            <br />
                            <button onClick={handleSave} className="mt-4 text-blue-600 font-medium hover:underline">
                                Continue to Dashboard
                            </button>
                        </div>
                    ) : (
                        courses.map((course) => {
                            const isSelected = selected.includes(course.id);
                            return (
                                <motion.div
                                    key={course.id}
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => toggleCourse(course.id)}
                                    className={`
                                        group relative p-6 rounded-2xl cursor-pointer transition-all duration-300 border-2
                                        ${isSelected
                                            ? 'border-blue-600 bg-white dark:bg-zinc-900 shadow-xl shadow-blue-500/10'
                                            : 'border-transparent bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md hover:border-zinc-200 dark:hover:border-zinc-700'}
                                    `}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`
                                            w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0
                                            ${isSelected
                                                ? 'bg-blue-600 text-white rotate-3 scale-110 shadow-lg shadow-blue-600/30'
                                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-500'}
                                        `}>
                                            {isSelected ? <Check className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className={`
                                                    text-xs font-bold px-2 py-1 rounded-md transition-colors
                                                    ${isSelected ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}
                                                `}>
                                                    {course.code}
                                                </span>
                                            </div>
                                            <h3 className={`font-semibold text-lg transition-colors ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-900 dark:text-white'}`}>
                                                {course.name}
                                            </h3>
                                            {course.description && (
                                                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                                                    {course.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Selection Glow Effect */}
                                    {isSelected && (
                                        <div className="absolute inset-0 rounded-2xl bg-blue-600/5 dark:bg-blue-600/10 pointer-events-none animate-pulse"></div>
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </motion.div>

                {/* Sticky Action Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent dark:from-black dark:via-black z-20 flex justify-center backdrop-blur-[2px]"
                >
                    <div className="max-w-4xl w-full flex items-center justify-between bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-4 rounded-2xl shadow-2xl shadow-zinc-900/20">
                        <div className="pl-4">
                            <span className="text-sm font-medium opacity-80">
                                {selected.length} {selected.length === 1 ? 'course' : 'courses'} selected
                            </span>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving || selected.length === 0}
                            className={`
                                px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all
                                ${selected.length > 0
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5'
                                    : 'bg-zinc-700 dark:bg-zinc-200 text-zinc-400 dark:text-zinc-500 cursor-not-allowed opacity-50'}
                            `}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Starting...
                                </>
                            ) : (
                                <>
                                    Start Learning
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>

                {/* Spacer for sticky footer */}
                <div className="h-32"></div>
            </div>
        </div>
    );
}
