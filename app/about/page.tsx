'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import {
    Target, Users, Award, Heart, Globe, Rocket,
    ArrowRight, Building2, Lightbulb
} from 'lucide-react';

const team = [
    {
        name: 'Alexander Bergström',
        role: 'CEO & Co-founder',
        bio: 'Former ML Engineer at DeepMind. PhD in Cognitive Science from KTH.',
        avatar: '👨‍💻'
    },
    {
        name: 'Sofia Lindqvist',
        role: 'CTO & Co-founder',
        bio: 'Ex-Spotify Staff Engineer. 10+ years in distributed systems.',
        avatar: '👩‍💻'
    },
    {
        name: 'Johan Andersson',
        role: 'Head of Education',
        bio: 'Former Mathematics Professor at Chalmers. EdTech veteran.',
        avatar: '👨‍🏫'
    },
    {
        name: 'Emma Nilsson',
        role: 'Head of Product',
        bio: 'Previously led product at Duolingo. UX/Learning expert.',
        avatar: '👩‍🎨'
    }
];

const values = [
    {
        icon: Target,
        title: 'Student-First',
        description: 'Every decision is guided by what\'s best for learners.'
    },
    {
        icon: Lightbulb,
        title: 'Evidence-Based',
        description: 'We build on proven cognitive science and learning research.'
    },
    {
        icon: Heart,
        title: 'Accessibility',
        description: 'Quality education should be available to everyone.'
    },
    {
        icon: Rocket,
        title: 'Innovation',
        description: 'We push boundaries in educational technology.'
    }
];

const timeline = [
    { year: '2022', event: 'Qmath founded in Stockholm' },
    { year: '2023', event: 'First university partnership with KTH' },
    { year: '2024', event: 'Adaptive engine v2 launched' },
    { year: '2025', event: '10,000+ students milestone' },
    { year: '2026', event: 'AI Tutor public beta' }
];

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white">
            <Header />

            {/* Hero */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
                    >
                        Building the future of{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            math education
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto"
                    >
                        We believe every engineering student deserves access to personalized, intelligent tutoring. That's why we built Qmath.
                    </motion.p>
                </div>
            </section>

            {/* Mission */}
            <section className="py-24 px-4 bg-zinc-50 dark:bg-zinc-950">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
                            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
                                Engineering mathematics is hard. Traditional textbooks and one-size-fits-all courses leave too many talented students behind. We saw brilliant peers struggling not because they lacked ability, but because they didn't have the right support.
                            </p>
                            <p className="text-lg text-zinc-600 dark:text-zinc-400">
                                Qmath combines cutting-edge AI with proven learning science to create a personal tutor that adapts to each student's unique needs, available 24/7.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="grid grid-cols-2 gap-6"
                        >
                            {values.map((value, i) => (
                                <div
                                    key={i}
                                    className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800"
                                >
                                    <value.icon className="w-8 h-8 text-blue-500 mb-4" />
                                    <h3 className="font-bold mb-2">{value.title}</h3>
                                    <p className="text-sm text-zinc-500">{value.description}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-24 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Meet the Team</h2>
                        <p className="text-xl text-zinc-600 dark:text-zinc-400">
                            Engineers, educators, and researchers united by a shared mission
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {team.map((member, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800"
                            >
                                <div className="text-6xl mb-4">{member.avatar}</div>
                                <h3 className="font-bold text-lg">{member.name}</h3>
                                <p className="text-blue-500 text-sm mb-3">{member.role}</p>
                                <p className="text-sm text-zinc-500">{member.bio}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-24 px-4 bg-zinc-50 dark:bg-zinc-950">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-16">Our Journey</h2>
                    <div className="space-y-8">
                        {timeline.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-6"
                            >
                                <div className="w-20 text-right">
                                    <span className="text-2xl font-bold text-blue-500">{item.year}</span>
                                </div>
                                <div className="w-4 h-4 rounded-full bg-blue-500 relative">
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-px h-12 bg-zinc-300 dark:bg-zinc-700"></div>
                                </div>
                                <div className="flex-1 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    {item.event}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-24 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { value: '10K+', label: 'Students' },
                            { value: '25+', label: 'Universities' },
                            { value: '50K+', label: 'Questions' },
                            { value: '95%', label: 'Pass Rate' }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {stat.value}
                                </div>
                                <div className="text-zinc-500 mt-2">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="max-w-4xl mx-auto text-center text-white">
                    <h2 className="text-4xl font-bold mb-6">Join Us on This Journey</h2>
                    <p className="text-xl text-white/80 mb-8">
                        We're always looking for talented people who share our passion for education.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/careers"
                            className="px-8 py-4 bg-white text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                        >
                            View Open Positions
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/contact"
                            className="px-8 py-4 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-all border border-white/20"
                        >
                            Get in Touch
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="py-12 border-t border-zinc-200 dark:border-zinc-900 text-center text-zinc-500 text-sm">
                <p>© 2026 Qmath EdTech AB. All rights reserved.</p>
            </footer>
        </main>
    );
}
