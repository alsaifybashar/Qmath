'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    BarChart3,
    BookOpen,
    ChevronRight,
    FileText,
    Play,
    Target,
} from 'lucide-react';

const upcomingExams = [
    { id: 'calc1-final', name: 'Envariabelanalys 1 Tenta', course: 'SF1625', date: '15 jan, 2026', daysLeft: 8, readiness: 72 },
    { id: 'linalg-mid', name: 'Linjär algebra Dugga', course: 'SF1624', date: '22 jan, 2026', daysLeft: 15, readiness: 58 },
];

const pastExams = [
    { id: 'physics-mid', name: 'Mekanik Dugga', course: 'SG1113', date: '10 dec, 2025', score: 78 },
    { id: 'calc1-mid', name: 'Envariabelanalys 1 Dugga', course: 'SF1625', date: '15 nov, 2025', score: 85 },
];

const availableExams = [
    { id: 'calc1', name: 'Envariabelanalys 1', questions: 45, duration: '3 timmar' },
    { id: 'linalg', name: 'Linjär algebra', questions: 40, duration: '2.5 timmar' },
    { id: 'physics1', name: 'Mekanik', questions: 35, duration: '3 timmar' },
    { id: 'diffeq', name: 'Differentialekvationer', questions: 38, duration: '3 timmar' },
];

export default function ExamsPage() {
    const nextExam = upcomingExams[0];

    return (
        <div className="liquid-page pb-20">
            <div className="liquid-bg" />
            <div className="liquid-sheen" />

            <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
                <motion.section
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="liquid-card p-5 sm:p-6"
                >
                    <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-center">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-100">
                                <FileText className="h-3.5 w-3.5" />
                                Tentamensläge
                            </div>
                            <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">Träna under rätt tryck</h1>
                            <p className="liquid-muted mt-3 max-w-2xl text-sm leading-6">
                                Fokusera på nästa simulering, se beredskap och starta utan att drunkna i historik.
                            </p>
                        </div>

                        <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4 shadow-xl shadow-emerald-500/10">
                            <div className="mb-3 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-300/15 text-emerald-700 dark:text-emerald-100">
                                    <Target className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-200">Nästa tenta</p>
                                    <p className="text-2xl font-bold">{nextExam.readiness}%</p>
                                </div>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                                <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-blue-300" style={{ width: `${nextExam.readiness}%` }} />
                            </div>
                            <p className="liquid-muted mt-3 text-sm font-semibold">{nextExam.course} · {nextExam.daysLeft} dagar kvar</p>
                        </div>
                    </div>
                </motion.section>

                <section className="liquid-card mt-4 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-blue-300/25 bg-blue-400/15 text-blue-700 shadow-lg shadow-blue-500/10 dark:text-blue-100">
                                <Play className="h-5 w-5 fill-current" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-blue-700 dark:text-blue-200">Gör detta först</p>
                                <h2 className="mt-1 text-xl font-bold">{nextExam.name}</h2>
                                <p className="liquid-muted mt-1 text-sm leading-6">
                                    Kör en realistisk simulering och gå direkt igenom misstagen efteråt.
                                </p>
                            </div>
                        </div>
                        <Link
                            href={`/exams/${nextExam.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-blue-100"
                        >
                            Starta förberedelse
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                </section>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                    <section className="liquid-card p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-200" />
                            <h2 className="text-base font-bold">Simuleringar</h2>
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                            {availableExams.map((exam) => (
                                <Link key={exam.id} href={`/exams/${exam.id}/simulate`} className="liquid-card-soft group flex items-center justify-between p-3 transition hover:-translate-y-0.5">
                                    <div>
                                        <h3 className="text-sm font-bold group-hover:text-blue-600 dark:group-hover:text-blue-200">{exam.name}</h3>
                                        <p className="liquid-muted mt-1 text-xs">{exam.questions} frågor · {exam.duration}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 liquid-subtle transition group-hover:translate-x-0.5" />
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section className="liquid-card p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-200" />
                            <h2 className="text-base font-bold">Senaste resultat</h2>
                        </div>
                        <div className="space-y-2">
                            {pastExams.map((exam) => (
                                <Link key={exam.id} href={`/exams/history/${exam.id}`} className="liquid-card-soft flex items-center justify-between p-3 transition hover:-translate-y-0.5">
                                    <div>
                                        <h3 className="text-sm font-bold">{exam.name}</h3>
                                        <p className="liquid-muted mt-1 text-xs">{exam.course} · {exam.date}</p>
                                    </div>
                                    <span className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-sm font-bold text-emerald-700 dark:text-emerald-200">
                                        {exam.score}%
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>

                <section className="liquid-card mt-4 p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-200" />
                        <div>
                            <h2 className="text-sm font-bold">Tentamenstips</h2>
                            <p className="liquid-muted mt-1 text-sm leading-6">
                                Simulera tentamensvillkor: tidsbestäm passet, undvik distraktioner och analysera bara de största misstagen efteråt.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
