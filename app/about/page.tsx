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
        role: 'VD & Medgrundare',
        bio: 'Tidigare ML-ingenjör på DeepMind. Doktor i kognitionsvetenskap från KTH.',
        avatar: '👨‍💻'
    },
    {
        name: 'Sofia Lindqvist',
        role: 'CTO & Medgrundare',
        bio: 'Tidigare Staff Engineer på Spotify. 10+ år inom distribuerade system.',
        avatar: '👩‍💻'
    },
    {
        name: 'Johan Andersson',
        role: 'Utbildningschef',
        bio: 'Tidigare matematikprofessor på Chalmers. EdTech-veteran.',
        avatar: '👨‍🏫'
    },
    {
        name: 'Emma Nilsson',
        role: 'Produktchef',
        bio: 'Tidigare produktledare på Duolingo. Expert på UX/lärande.',
        avatar: '👩‍🎨'
    }
];

const values = [
    {
        icon: Target,
        title: 'Studenten först',
        description: 'Varje beslut styrs av vad som är bäst för de studerande.'
    },
    {
        icon: Lightbulb,
        title: 'Evidensbaserad',
        description: 'Vi bygger på beprövad kognitionsvetenskap och lärandeforskning.'
    },
    {
        icon: Heart,
        title: 'Tillgänglighet',
        description: 'Kvalitetsutbildning ska vara tillgänglig för alla.'
    },
    {
        icon: Rocket,
        title: 'Innovation',
        description: 'Vi flyttar gränserna inom utbildningsteknologi.'
    }
];

const timeline = [
    { year: '2022', event: 'Qmath grundas i Stockholm' },
    { year: '2023', event: 'Första universitetspartnerskapet med KTH' },
    { year: '2024', event: 'Adaptiv motor v2 lanserad' },
    { year: '2025', event: 'Milstolpe: 10 000+ studenter' },
    { year: '2026', event: 'AI-handledare offentlig beta' }
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
                        Bygger framtiden för{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            matematikutbildning
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto"
                    >
                        Vi anser att varje civilingenjörsstudent förtjänar tillgång till personlig, intelligent handledning. Det är därför vi byggde Qmath.
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
                            <h2 className="text-4xl font-bold mb-6">Vårt uppdrag</h2>
                            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
                                Ingenjörsmatematik är svårt. Traditionella läroböcker och standardkurser lämnar för många begåvade studenter bakom sig. Vi såg briljanta kamrater kämpa inte för att de saknade förmåga, utan för att de inte hade rätt stöd.
                            </p>
                            <p className="text-lg text-zinc-600 dark:text-zinc-400">
                                Qmath kombinerar banbrytande AI med beprövad lärandevetenskap för att skapa en personlig handledare som anpassar sig till varje students unika behov, tillgänglig dygnet runt.
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
                        <h2 className="text-4xl font-bold mb-4">Möt teamet</h2>
                        <p className="text-xl text-zinc-600 dark:text-zinc-400">
                            Ingenjörer, pedagoger och forskare förenade av ett gemensamt uppdrag
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
                    <h2 className="text-3xl font-bold text-center mb-16">Vår resa</h2>
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
                            { value: '10K+', label: 'Studenter' },
                            { value: '25+', label: 'Universitet' },
                            { value: '50K+', label: 'Frågor' },
                            { value: '95%', label: 'Godkännandegrad' }
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
                    <h2 className="text-4xl font-bold mb-6">Följ med oss på resan</h2>
                    <p className="text-xl text-white/80 mb-8">
                        Vi letar alltid efter talangfulla människor som delar vår passion för utbildning.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/careers"
                            className="px-8 py-4 bg-white text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                        >
                            Se lediga tjänster
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/contact"
                            className="px-8 py-4 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-all border border-white/20"
                        >
                            Kontakta oss
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="py-12 border-t border-zinc-200 dark:border-zinc-900 text-center text-zinc-500 text-sm">
                <p>© 2026 Qmath EdTech AB. Alla rättigheter förbehållna.</p>
            </footer>
        </main>
    );
}
