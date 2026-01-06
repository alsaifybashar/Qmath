'use client';

import { useState } from 'react';
import { Search, Upload, FileText, ArrowUpRight, ChevronDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';

// Mock data for search suggestions
const SUGGESTED_COURSES = [
    { code: 'TAMS39', name: 'Multivariate Statistics' },
    { code: 'TATA32', name: 'Linear Algebra' },
    { code: 'TAOP61', name: 'Optimization' },
    { code: 'TDDE18', name: 'C++ Programming' },
];

export default function ExamsPage() {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    return (
        <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300 flex flex-col">
            <Header />

            <div className="flex-1 flex flex-col items-center justify-center px-4 w-full max-w-5xl mx-auto mt-20 md:mt-0">

                {/* Logo / Title Area */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12 space-y-4"
                >
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            Qmath <span className="text-zinc-400 dark:text-zinc-600 font-light">Exams</span>
                        </h1>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                        Search and download past exams, solutions, and summary sheets.
                    </p>
                </motion.div>

                {/* Search Bar Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className={`
                w-full max-w-2xl bg-white dark:bg-zinc-900 
                border rounded-2xl shadow-sm transition-all duration-200
                flex items-center p-2
                ${isFocused
                            ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-xl'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }
            `}
                >
                    {/* Filter Dropdown (Visual Only) */}
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border-r border-zinc-100 dark:border-zinc-800 mr-2">
                        <span>Exams</span>
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                    </button>

                    {/* Input */}
                    <div className="flex-1 flex items-center gap-3 px-2">
                        <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-blue-500' : 'text-zinc-400'}`} />
                        <input
                            type="text"
                            placeholder="Search by course code (e.g., TAMS39)..."
                            className="w-full bg-transparent border-none outline-none text-lg placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                        />
                    </div>

                    {/* Action Arrow */}
                    <button className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>

                {/* Quick Links / Suggestions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 flex flex-wrap justify-center gap-4 text-sm"
                >
                    {SUGGESTED_COURSES.map((course) => (
                        <Link
                            key={course.code}
                            href={`/exams/${course.code}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                        >
                            <span className="font-semibold">{course.code}</span>
                            <ArrowUpRight className="w-3 h-3 opacity-50" />
                        </Link>
                    ))}
                </motion.div>

                {/* Upload CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-16"
                >
                    <Link href="/upload" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-all bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md">
                        <Upload className="w-4 h-4" />
                        Upload exam or solution
                    </Link>
                </motion.div>

            </div>
        </main>
    );
}
