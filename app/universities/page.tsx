'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import {
    Building2, Users, BarChart3, Shield, CheckCircle2,
    ArrowRight, Globe, BookOpen, Brain, Sparkles
} from 'lucide-react';

const benefits = [
    {
        icon: Brain,
        title: 'Adaptive Learning at Scale',
        description: 'Our AI-driven platform adapts to each student\'s knowledge level, providing personalized learning paths for thousands of students simultaneously.'
    },
    {
        icon: BarChart3,
        title: 'Real-time Analytics',
        description: 'Track student progress, identify struggling areas, and make data-driven decisions to improve course outcomes.'
    },
    {
        icon: BookOpen,
        title: 'Curriculum Integration',
        description: 'Seamlessly integrate with your existing curriculum. We work with your faculty to align content with your course objectives.'
    },
    {
        icon: Shield,
        title: 'Enterprise Security',
        description: 'GDPR compliant, SSO integration, and enterprise-grade security to protect student data.'
    }
];

const stats = [
    { value: '25+', label: 'Partner Universities' },
    { value: '50,000+', label: 'Students Served' },
    { value: '95%', label: 'Exam Pass Rate' },
    { value: '40%', label: 'Time Saved for Faculty' }
];

const testimonials = [
    {
        quote: "Qmath has transformed how our students prepare for exams. The adaptive learning approach has significantly improved pass rates.",
        author: "Dr. Maria Andersson",
        role: "Head of Mathematics, KTH"
    },
    {
        quote: "The analytics dashboard gives us unprecedented insights into student performance. We can now intervene before students fall behind.",
        author: "Prof. Erik Lindqvist",
        role: "Dean of Engineering, Chalmers"
    }
];

export default function UniversitiesPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white">
            <Header />

            {/* Hero */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-8"
                    >
                        <Building2 className="w-4 h-4" />
                        For Universities & Institutions
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
                    >
                        Transform your{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            STEM education
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-12"
                    >
                        Partner with Qmath to provide your students with AI-powered adaptive learning that improves outcomes and reduces faculty workload.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Link
                            href="/contact"
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            Schedule a Demo
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/demo"
                            className="px-8 py-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full font-semibold transition-all border border-zinc-200 dark:border-zinc-800"
                        >
                            Try Platform Demo
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16 bg-zinc-50 dark:bg-zinc-950 border-y border-zinc-200 dark:border-zinc-800">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center"
                            >
                                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-zinc-500 mt-2">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-24 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Why Universities Choose Qmath</h2>
                        <p className="text-xl text-zinc-600 dark:text-zinc-400">
                            A complete solution for modern STEM education
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {benefits.map((benefit, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800"
                            >
                                <benefit.icon className="w-10 h-10 text-blue-500 mb-4" />
                                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                                <p className="text-zinc-600 dark:text-zinc-400">{benefit.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 px-4 bg-zinc-50 dark:bg-zinc-950">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-16">Trusted by Leading Institutions</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        {testimonials.map((testimonial, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800"
                            >
                                <p className="text-lg mb-6 italic">"{testimonial.quote}"</p>
                                <div>
                                    <div className="font-semibold">{testimonial.author}</div>
                                    <div className="text-sm text-zinc-500">{testimonial.role}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="max-w-4xl mx-auto text-center text-white">
                    <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Institution?</h2>
                    <p className="text-xl text-white/80 mb-8">
                        Join 25+ leading universities already using Qmath
                    </p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 px-10 py-5 bg-white text-blue-600 rounded-full font-bold hover:bg-blue-50 transition-all"
                    >
                        Get in Touch
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            <footer className="py-12 border-t border-zinc-200 dark:border-zinc-900 text-center text-zinc-500 text-sm">
                <p>© 2026 Qmath EdTech AB. All rights reserved.</p>
            </footer>
        </main>
    );
}
