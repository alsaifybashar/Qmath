'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Building2, GraduationCap, Search, ChevronDown, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';
import { getUniversities } from '@/app/actions/courses';
import { saveOnboardingProfile } from '@/app/actions/user';

interface University {
    id: string;
    name: string;
    country: string | null;
}

const PROGRAMS = [
    'Datateknik',
    'Design och produktutveckling',
    'Elektroteknik',
    'Elektronik och systemdesign',
    'Energi – miljö – management',
    'Industriell ekonomi',
    'Informationsteknologi',
    'Kemiteknik',
    'Maskinteknik',
    'Medicinsk teknik',
    'Medieteknik och AI',
    'Mjukvaruteknik',
    'Teknisk biologi',
    'Teknisk fysik',
    'Teknisk matematik',
    'Samhällsbyggnad',
    'Civilingenjör (annat)',
    'Högskoleingenjör',
    'Annan utbildning',
];

export default function OnboardingUniversity() {
    const router = useRouter();
    const [universities, setUniversities] = useState<University[]>([]);
    const [loadingUnis, setLoadingUnis] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
    const [program, setProgram] = useState('');
    const [customProgram, setCustomProgram] = useState('');
    const [studyYear, setStudyYear] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getUniversities().then((res) => {
            if (res.data) setUniversities(res.data);
            setLoadingUnis(false);
        });
    }, []);

    const filteredUniversities = universities.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase())
    );

    const effectiveProgram = program === 'Annan utbildning' ? customProgram : program;
    const canContinue = selectedUniversity && effectiveProgram.trim().length >= 2 && studyYear !== null;

    const handleContinue = () => {
        if (!canContinue || !selectedUniversity || !studyYear) return;
        setError(null);

        startTransition(async () => {
            const res = await saveOnboardingProfile({
                universityId: selectedUniversity.id,
                universityProgram: effectiveProgram,
                studyYear,
            });

            if (res?.error) {
                setError(res.error);
                return;
            }

            router.push('/onboarding/courses');
        });
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="w-full max-w-lg"
            >
                {/* Progress bar */}
                <div className="flex gap-1.5 mb-8">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= 1 ? 'bg-indigo-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                        />
                    ))}
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
                    {/* Header */}
                    <div className="px-6 pt-6 pb-5 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Step 2 of 4</span>
                        </div>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Your university & program</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">We'll show courses relevant to your curriculum.</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* University */}
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                University
                            </label>
                            <div className="relative mb-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search universities..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <div className="max-h-[176px] overflow-y-auto rounded-xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-50 dark:divide-zinc-800">
                                {loadingUnis ? (
                                    <div className="py-6 text-center text-sm text-zinc-400">Loading universities…</div>
                                ) : filteredUniversities.length === 0 ? (
                                    <div className="py-6 text-center text-sm text-zinc-400">No universities found</div>
                                ) : (
                                    filteredUniversities.map((uni) => {
                                        const active = selectedUniversity?.id === uni.id;
                                        return (
                                            <button
                                                key={uni.id}
                                                type="button"
                                                onClick={() => setSelectedUniversity(uni)}
                                                className={`w-full flex items-center justify-between text-left px-3 py-2.5 text-sm transition-colors ${active
                                                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold'
                                                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                                }`}
                                            >
                                                <span>{uni.name}</span>
                                                {active && <Check className="w-4 h-4 shrink-0" />}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            <AnimatePresence>
                                {selectedUniversity && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-2 flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                            <Check className="w-3.5 h-3.5" />
                                            {selectedUniversity.name}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Program */}
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                <GraduationCap className="inline w-4 h-4 mr-1.5 opacity-50 -mt-0.5" />
                                Program
                            </label>
                            <div className="relative">
                                <select
                                    value={program}
                                    onChange={(e) => setProgram(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Select your program</option>
                                    {PROGRAMS.map((p) => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                            </div>
                            <AnimatePresence>
                                {program === 'Annan utbildning' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <input
                                            type="text"
                                            placeholder="Enter your program name"
                                            value={customProgram}
                                            onChange={(e) => setCustomProgram(e.target.value)}
                                            className="mt-2 w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Year of study */}
                        <div>
                            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                Year of study
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((year) => (
                                    <button
                                        key={year}
                                        type="button"
                                        onClick={() => setStudyYear(year)}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${studyYear === year
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                        }`}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer nav */}
                    <div className="px-6 pb-6 flex items-center justify-between">
                        <button
                            onClick={() => router.push('/onboarding/welcome')}
                            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                        <button
                            onClick={handleContinue}
                            disabled={!canContinue || isPending}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${canContinue && !isPending
                                ? 'bg-indigo-600 hover:bg-indigo-500 active:scale-[0.97] text-white shadow-sm'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                            }`}
                        >
                            {isPending ? 'Saving…' : 'Continue'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
