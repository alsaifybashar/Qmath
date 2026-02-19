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
        title: 'Adaptivt lärande i skala',
        description: 'Vår AI-drivna plattform anpassar sig till varje students kunskapsnivå och erbjuder personliga lärvägar för tusentals studenter samtidigt.'
    },
    {
        icon: BarChart3,
        title: 'Realtidsanalys',
        description: 'Följ studenternas framsteg, identifiera svaga områden och fatta datadrivna beslut för att förbättra kursresultaten.'
    },
    {
        icon: BookOpen,
        title: 'Kursintegrering',
        description: 'Integrera sömlöst med er befintliga läroplan. Vi arbetar med er fakultet för att anpassa innehållet till era kursmål.'
    },
    {
        icon: Shield,
        title: 'Företagssäkerhet',
        description: 'GDPR-kompatibel, SSO-integrering och säkerhet av företagsklass för att skydda studentdata.'
    }
];

const stats = [
    { value: '25+', label: 'Partneruniversitet' },
    { value: '50,000+', label: 'Studenter betjänade' },
    { value: '95%', label: 'Tentamensgodkännande' },
    { value: '40%', label: 'Tid sparad för fakulteten' }
];

const testimonials = [
    {
        quote: "Qmath har förändrat hur våra studenter förbereder sig för tentor. Det adaptiva lärandet har avsevärt förbättrat godkännandegraden.",
        author: "Dr. Maria Andersson",
        role: "Chef för matematik, KTH"
    },
    {
        quote: "Analyspanelen ger oss oöverträffade insikter i studenternas prestationer. Vi kan nu ingripa innan studenterna hamnar efter.",
        author: "Prof. Erik Lindqvist",
        role: "Dekanus för teknik, Chalmers"
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
                        För universitet & institutioner
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
                    >
                        Omvandla er{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            STEM-utbildning
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-12"
                    >
                        Samarbeta med Qmath för att ge era studenter AI-drivet adaptivt lärande som förbättrar resultat och minskar fakultetens arbetsbörda.
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
                            Boka en demo
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/demo"
                            className="px-8 py-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full font-semibold transition-all border border-zinc-200 dark:border-zinc-800"
                        >
                            Prova plattformsdemo
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
                        <h2 className="text-4xl font-bold mb-4">Varför universitet väljer Qmath</h2>
                        <p className="text-xl text-zinc-600 dark:text-zinc-400">
                            En komplett lösning för modern STEM-utbildning
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
                    <h2 className="text-3xl font-bold text-center mb-16">Betrodd av ledande institutioner</h2>
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
                    <h2 className="text-4xl font-bold mb-6">Redo att omvandla er institution?</h2>
                    <p className="text-xl text-white/80 mb-8">
                        Gå med i 25+ ledande universitet som redan använder Qmath
                    </p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 px-10 py-5 bg-white text-blue-600 rounded-full font-bold hover:bg-blue-50 transition-all"
                    >
                        Kontakta oss
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            <footer className="py-12 border-t border-zinc-200 dark:border-zinc-900 text-center text-zinc-500 text-sm">
                <p>© 2026 Qmath EdTech AB. Alla rättigheter förbehållna.</p>
            </footer>
        </main>
    );
}
