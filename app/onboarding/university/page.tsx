'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Building2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const universities = [
    { id: 'kth', name: 'KTH Royal Institute of Technology', location: 'Stockholm', students: '12,000+' },
    { id: 'chalmers', name: 'Chalmers University of Technology', location: 'Gothenburg', students: '10,000+' },
    { id: 'lund', name: 'Lund University - LTH', location: 'Lund', students: '8,000+' },
    { id: 'liu', name: 'Linköping University', location: 'Linköping', students: '6,000+' },
    { id: 'uu', name: 'Uppsala University', location: 'Uppsala', students: '7,000+' },
    { id: 'umu', name: 'Umeå University', location: 'Umeå', students: '4,000+' },
    { id: 'other', name: 'Other University', location: 'Various', students: '' }
];

export default function OnboardingUniversity() {
    const router = useRouter();
    const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUniversities = universities.filter(uni =>
        uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uni.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20"></div>
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear_gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 max-w-2xl w-full"
            >
                <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 md:p-12">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <Building2 className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Select your university</h1>
                            <p className="text-zinc-400">We'll customize content for your curriculum</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search universities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    {/* University Grid */}
                    <div className="grid gap-3 max-h-[400px] overflow-y-auto mb-8 pr-2">
                        {filteredUniversities.map((uni) => (
                            <motion.button
                                key={uni.id}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setSelectedUniversity(uni.id)}
                                className={`w-full p-4 rounded-xl border text-left transition-all ${selectedUniversity === uni.id
                                    ? 'bg-blue-500/10 border-blue-500'
                                    : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-white">{uni.name}</div>
                                        <div className="text-sm text-zinc-400">{uni.location}</div>
                                    </div>
                                    {uni.students && (
                                        <div className="text-xs text-zinc-500 bg-zinc-700/50 px-2 py-1 rounded">
                                            {uni.students} students
                                        </div>
                                    )}
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.push('/onboarding/welcome')}
                            className="flex items-center gap-2 px-6 py-3 text-zinc-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back
                        </button>
                        <button
                            onClick={() => selectedUniversity && router.push('/onboarding/program')}
                            disabled={!selectedUniversity}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${selectedUniversity
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
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
                    <div className="w-8 h-1 rounded-full bg-zinc-700"></div>
                    <div className="w-8 h-1 rounded-full bg-zinc-700"></div>
                    <div className="w-8 h-1 rounded-full bg-zinc-700"></div>
                </div>
            </motion.div>
        </div>
    );
}
