'use client';

import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, BrainCircuit, Building2, ChevronRight, GraduationCap, LayoutDashboard, Mail, Terminal, Users } from "lucide-react";
// Dynamic import for client-side rendering of Math
import dynamic from 'next/dynamic';
import { ParticleBackground } from "@/components/ParticleBackground";
import 'katex/dist/katex.min.css';

// Dynamically import KaTeX components with no SSR
const BlockMath = dynamic(() => import('react-katex').then((mod) => mod.BlockMath), { ssr: false });

// Custom scroll animations
import { ScrollSection, ScrollConnector } from "@/components/ScrollAnimation";
import { QuoteSeparator } from "@/components/QuoteSeparator";
import { motion } from "framer-motion";

import { Header } from "@/components/Header";

export default function Home() {
    return (
        <main className="relative min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white selection:bg-blue-500/30 transition-colors duration-300 overflow-hidden">
            <Header />

            {/* Visual Connector Line running through the page */}
            <ScrollConnector />

            {/* 1. HERO SECTION */}
            <section className="relative flex flex-col items-center justify-center min-h-[100vh] px-4 overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
                {/* Background Grid & Math Decor */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <ParticleBackground />

                {/* Floating Math Cards - Dynamic & Elegant */}
                <div className="absolute top-20 right-[10%] opacity-10 dark:opacity-20 hidden lg:block rotate-12 animate-float-slow">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-2xl backdrop-blur-sm">
                        <BlockMath math="\oint_C \vec{F} \cdot d\vec{r} = \iint_S (\nabla \times \vec{F}) \cdot d\vec{S}" />
                    </div>
                </div>

                <div className="absolute bottom-32 left-[5%] opacity-10 dark:opacity-20 hidden lg:block -rotate-6 animate-float">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-2xl backdrop-blur-sm">
                        <BlockMath math="i\hbar \frac{\partial}{\partial t}\Psi = \hat{H}\Psi" />
                    </div>
                </div>

                <div className="absolute top-32 left-[15%] opacity-10 dark:opacity-20 hidden lg:block rotate-3 animate-float-fast">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xl backdrop-blur-sm scale-75">
                        <BlockMath math="e^{ix} = \cos(x) + i\sin(x)" />
                    </div>
                </div>

                <div className="absolute bottom-20 right-[20%] opacity-10 dark:opacity-20 hidden lg:block -rotate-12 animate-float-slow animation-delay-2000">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-xl backdrop-blur-sm scale-90">
                        <BlockMath math="\nabla \cdot \vec{E} = \frac{\rho}{\varepsilon_0}" />
                    </div>
                </div>

                <div className="absolute top-1/2 left-[8%] opacity-5 dark:opacity-10 hidden lg:block rotate-45 animate-float animation-delay-4000">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-lg backdrop-blur-sm scale-50">
                        <BlockMath math="\hat{f}(\xi) = \int_{-\infty}^{\infty} f(x)e^{-2\pi i x \xi}dx" />
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="z-10 text-center max-w-4xl mx-auto space-y-8"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        v1.0 Public Beta Live
                    </div>

                    <h1 className="text-5xl md:text-8xl font-bold tracking-tight text-zinc-900 dark:text-white pb-2">
                        The Operating System for <br />
                        <span className="text-blue-600 dark:text-blue-500">Engineering Math</span>
                    </h1>

                    <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        Qmath is not just a question bank. It is an adaptive intelligence that continuously models your understanding of calculus, algebra, and physics to guarantee mastery.
                    </p>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
                    >
                        <Link href="/study" className="group px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 text-lg">
                            Start Studying
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </motion.div>
            </section>



            {/* 2. USP / FEATURES SECTION */}
            <ScrollSection className="py-32 px-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24 space-y-4">
                        <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white">Why Top Students Choose Qmath</h2>
                        <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">We replaced generic textbooks with a data-driven feedback loop.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<BrainCircuit className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
                            title="Adaptive Engine"
                            desc="Our BKT algorithms analyze your solving patterns to serve the perfect question at the perfect time."
                            link="/study"
                        />
                        <FeatureCard
                            icon={<BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                            title="Velocity Tracking"
                            desc="Visualize your learning curve. We track not just if you got it right, but how fast you're mastering concepts."
                            link="/dashboard"
                        />
                        <FeatureCard
                            icon={<Terminal className="w-6 h-6 text-green-600 dark:text-green-400" />}
                            title="Exam Simulation"
                            desc="Train under pressure. Our exam mode mirrors university constraints to eliminate test anxiety."
                            link="/exam"
                        />
                        <FeatureCard
                            icon={<BookOpen className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
                            title="Dynamic Scaffolding"
                            desc="Got it wrong? We automatically break the problem down into 3 simpler steps to rebuild your intuition."
                            link="/study"
                        />
                        <FeatureCard
                            icon={<LayoutDashboard className="w-6 h-6 text-pink-600 dark:text-pink-400" />}
                            title="Huge Database"
                            desc="Thousands of verified engineering problems from Calculus I, II, III, Linear Algebra, and Mechanics."
                        />
                        <FeatureCard
                            icon={<GraduationCap className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />}
                            title="University Aligned"
                            desc="Curriculum structure aligned with top technical universities across Europe."
                        />
                    </div>
                </div>
            </ScrollSection>



            {/* 3. PARTNERS / TRUST SECTION */}
            <ScrollSection className="py-32 px-4 border-y border-zinc-200 dark:border-zinc-900 bg-white dark:bg-black">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-16">Developed in collaboration with researchers from</p>
                    <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Text adapted for contrast */}
                        <div className="flex items-center gap-3 text-3xl font-bold text-zinc-400 dark:text-zinc-600 hover:scale-105 transition-transform duration-500">
                            <Building2 className="w-10 h-10" /> TechUniversity <span className="text-blue-500">STHLM</span>
                        </div>
                        <div className="flex items-center gap-3 text-3xl font-bold text-zinc-400 dark:text-zinc-600 hover:scale-105 transition-transform duration-500">
                            <Building2 className="w-10 h-10" /> PolyTech <span className="text-red-500">Institute</span>
                        </div>
                        <div className="flex items-center gap-3 text-3xl font-bold text-zinc-400 dark:text-zinc-600 hover:scale-105 transition-transform duration-500">
                            <Building2 className="w-10 h-10" /> EngSci <span className="text-green-500">Academy</span>
                        </div>
                    </div>
                </div>
            </ScrollSection>

            {/* 4. THE MINDS / TEAM */}
            <ScrollSection className="py-32 px-4 bg-zinc-50 dark:bg-zinc-950">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center md:text-left text-zinc-900 dark:text-white">The Minds Behind Qmath</h2>
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <p className="text-xl text-zinc-600 dark:text-zinc-300 leading-relaxed font-light">
                                Qmath was born out of frustration. As engineering students and researchers, we saw brilliant minds struggle not because they lacked intelligence, but because they simply didn't have the right feedback loop.
                            </p>
                            <p className="text-xl text-zinc-600 dark:text-zinc-300 leading-relaxed font-light">
                                We combined cognitive science researchers with senior software architects to build a system that acts as a scalable, personal tutor.
                            </p>
                            <div className="pt-8">
                                <div className="flex items-center gap-6 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                    <div className="h-16 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                                        <Users className="w-8 h-8 text-zinc-600 dark:text-zinc-500" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-semibold text-zinc-900 dark:text-white">The Founding Team</div>
                                        <div className="text-zinc-500">Ex-DeepMind, KTH Alumni & EdTech Vets</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visual abstract representation of the team/brain */}
                        <motion.div
                            whileHover={{ scale: 1.02, rotate: 1 }}
                            className="relative h-[400px] w-full bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shadow-2xl"
                        >
                            <div className="absolute inset-0 bg-blue-500/5 blur-3xl"></div>
                            <div className="relative text-center">
                                <BrainCircuit className="w-24 h-24 text-zinc-400 dark:text-zinc-600 mx-auto mb-6" />
                                <div className="text-zinc-400 dark:text-zinc-500 font-mono text-lg space-y-2">
                                    <div>&lt;Pedagogy /&gt;</div>
                                    <div>&lt;Code /&gt;</div>
                                    <div>&lt;Math /&gt;</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </ScrollSection>

            <QuoteSeparator
                imageSrc="/images/fractal_growth.png"
                quote="Education is not the learning of facts, but the training of the mind to think."
                author="Albert Einstein"
            />

            {/* 5. CONTACT / INVESTORS */}
            <ScrollSection className="py-32 px-4 bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-900">
                <div className="max-w-4xl mx-auto text-center space-y-12">
                    <h2 className="text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">Build the Future of Education</h2>
                    <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                        We are rapidly expanding our partner network and feature set.
                        Whether you are a university dean, an angel investor, or a brilliant engineer—we want to hear from you.
                    </p>

                    <div className="flex flex-col md:flex-row gap-6 justify-center pt-8">
                        <a href="mailto:partners@qmath.com" className="px-10 py-5 bg-black dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-black rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-2xl hover:scale-105 transform duration-200">
                            <Mail className="w-5 h-5" />
                            Contact for Partnerships
                        </a>
                        <a href="mailto:investors@qmath.com" className="px-10 py-5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium transition flex items-center justify-center gap-2 shadow-sm hover:scale-105 transform duration-200">
                            Request Investment Deck
                        </a>
                    </div>
                </div>
            </ScrollSection>

            {/* FOOTER */}
            <footer className="py-12 border-t border-zinc-200 dark:border-zinc-900 text-center text-zinc-500 dark:text-zinc-600 text-sm bg-zinc-50 dark:bg-black z-10 relative">
                <p>&copy; 2026 Qmath EdTech AB. All rights reserved.</p>
            </footer>

        </main>
    );
}

function FeatureCard({ icon, title, desc, link }: { icon: any, title: string, desc: string, link?: string }) {
    const CardContent = (
        <div className="h-full bg-white dark:bg-zinc-900/40 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/30 hover:shadow-lg dark:hover:bg-zinc-900/60 transition-all cursor-pointer group">
            <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg inline-block border border-zinc-100 dark:border-zinc-800 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                {title}
                {link && <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                {desc}
            </p>
        </div>
    );

    if (link) {
        return <Link href={link} className="block h-full">{CardContent}</Link>;
    }
    return CardContent;
}
