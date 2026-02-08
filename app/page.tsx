'use client';

import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, BrainCircuit, Building2, ChevronRight, GraduationCap, LayoutDashboard, Mail, Terminal, Users, Sparkles, Zap, Shield, Play } from "lucide-react";
import dynamic from 'next/dynamic';
import { ParticleBackground } from "@/components/ParticleBackground";
import 'katex/dist/katex.min.css';

const BlockMath = dynamic(() => import('react-katex').then((mod) => mod.BlockMath), { ssr: false });

import { ScrollSection, ScrollConnector } from "@/components/ScrollAnimation";
import { QuoteSeparator } from "@/components/QuoteSeparator";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import { Header } from "@/components/Header";

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
};

// Floating math card component with parallax
function FloatingMathCard({
    math,
    className,
    delay = 0
}: {
    math: string;
    className: string;
    delay?: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: delay + 0.5 }}
            className={className}
        >
            <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-5 rounded-2xl shadow-2xl shadow-black/5 dark:shadow-black/20">
                <BlockMath math={math} />
            </div>
        </motion.div>
    );
}

export default function Home() {
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });

    const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

    return (
        <main className="relative min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white selection:bg-blue-500/30 overflow-hidden">
            <Header />
            <ScrollConnector />

            {/* 1. HERO SECTION - Redesigned with animated gradient */}
            <section ref={heroRef} className="relative flex flex-col items-center justify-center min-h-[100vh] px-4 overflow-hidden">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950" />

                {/* Animated gradient orbs */}
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />

                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
                <ParticleBackground />

                {/* Floating Math Cards with enhanced styling */}
                <FloatingMathCard
                    math="\oint_C \vec{F} \cdot d\vec{r} = \iint_S (\nabla \times \vec{F}) \cdot d\vec{S}"
                    className="absolute top-24 right-[8%] opacity-20 dark:opacity-30 hidden lg:block rotate-6 animate-float-slow"
                    delay={0}
                />
                <FloatingMathCard
                    math="i\hbar \frac{\partial}{\partial t}\Psi = \hat{H}\Psi"
                    className="absolute bottom-28 left-[3%] opacity-20 dark:opacity-30 hidden lg:block -rotate-3 animate-float"
                    delay={0.2}
                />
                <FloatingMathCard
                    math="e^{ix} = \cos(x) + i\sin(x)"
                    className="absolute top-40 left-[12%] opacity-15 dark:opacity-25 hidden lg:block rotate-2 animate-float-fast scale-90"
                    delay={0.4}
                />
                <FloatingMathCard
                    math="\nabla \cdot \vec{E} = \frac{\rho}{\varepsilon_0}"
                    className="absolute bottom-24 right-[15%] opacity-15 dark:opacity-25 hidden lg:block -rotate-6 animate-float-slow animation-delay-2000 scale-95"
                    delay={0.6}
                />

                {/* Hero Content */}
                <motion.div
                    style={{ opacity: heroOpacity, scale: heroScale }}
                    className="relative z-10 text-center max-w-5xl mx-auto space-y-8"
                >
                    {/* Beta badge with glow */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium backdrop-blur-sm"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        v1.0 Public Beta — Now Live
                    </motion.div>

                    {/* Main heading with text reveal */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight"
                    >
                        <span className="block text-zinc-900 dark:text-white">The Operating System for</span>
                        <span className="block mt-2 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                            Engineering Math
                        </span>
                    </motion.h1>

                    {/* Subheading */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed"
                    >
                        More than a question bank. An adaptive intelligence that continuously models
                        your understanding to <span className="text-zinc-900 dark:text-white font-medium">guarantee mastery</span>.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
                    >
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                            <Link
                                href="/study"
                                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-full font-semibold transition-all flex items-center gap-2 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 text-lg"
                            >
                                Start Studying Free
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                            <Link
                                href="/demo"
                                className="group px-8 py-4 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-full font-semibold transition-all flex items-center gap-2 shadow-lg"
                            >
                                <Play className="w-4 h-4" />
                                Watch Demo
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Trust indicators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 1 }}
                        className="flex flex-wrap justify-center gap-6 pt-8 text-sm text-zinc-500 dark:text-zinc-400"
                    >
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-500" />
                            <span>No credit card required</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            <span>10,000+ problems</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span>Used by top universities</span>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                >
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="w-6 h-10 rounded-full border-2 border-zinc-300 dark:border-zinc-700 flex items-start justify-center p-1"
                    >
                        <div className="w-1.5 h-2.5 bg-zinc-400 dark:bg-zinc-600 rounded-full" />
                    </motion.div>
                </motion.div>
            </section>

            {/* 2. FEATURES SECTION - Enhanced with staggered animations */}
            <ScrollSection className="py-32 px-4 bg-zinc-50 dark:bg-zinc-900/50 border-y border-zinc-200 dark:border-zinc-800">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="text-center mb-20 space-y-4"
                    >
                        <motion.span variants={fadeInUp} className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            Why Qmath
                        </motion.span>
                        <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white">
                            Built for Engineering Students
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                            We replaced generic textbooks with a data-driven feedback loop that adapts to how you learn.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <FeatureCard
                            icon={<BrainCircuit className="w-6 h-6" />}
                            iconColor="purple"
                            title="Adaptive Engine"
                            desc="Our BKT algorithms analyze your solving patterns to serve the perfect question at the perfect time."
                            link="/study"
                        />
                        <FeatureCard
                            icon={<BarChart3 className="w-6 h-6" />}
                            iconColor="blue"
                            title="Velocity Tracking"
                            desc="Visualize your learning curve. We track not just correctness, but how fast you're mastering concepts."
                            link="/dashboard"
                        />
                        <FeatureCard
                            icon={<Terminal className="w-6 h-6" />}
                            iconColor="emerald"
                            title="Exam Simulation"
                            desc="Train under pressure. Our exam mode mirrors university constraints to eliminate test anxiety."
                            link="/exam"
                        />
                        <FeatureCard
                            icon={<BookOpen className="w-6 h-6" />}
                            iconColor="orange"
                            title="Dynamic Scaffolding"
                            desc="Got it wrong? We automatically break problems into simpler steps to rebuild your intuition."
                            link="/study"
                        />
                        <FeatureCard
                            icon={<LayoutDashboard className="w-6 h-6" />}
                            iconColor="pink"
                            title="Huge Database"
                            desc="Thousands of verified problems from Calculus I-III, Linear Algebra, and Mechanics."
                        />
                        <FeatureCard
                            icon={<GraduationCap className="w-6 h-6" />}
                            iconColor="cyan"
                            title="University Aligned"
                            desc="Curriculum structure aligned with top technical universities across Europe."
                        />
                    </motion.div>
                </div>
            </ScrollSection>

            {/* 3. PARTNERS SECTION - Enhanced styling */}
            <ScrollSection className="py-24 px-4 bg-white dark:bg-zinc-950">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="max-w-7xl mx-auto text-center"
                >
                    <p className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-12">
                        Trusted by researchers from
                    </p>
                    <div className="flex flex-wrap justify-center gap-x-16 gap-y-8">
                        {[
                            { name: "TechUniversity", accent: "STHLM", color: "text-blue-500" },
                            { name: "PolyTech", accent: "Institute", color: "text-rose-500" },
                            { name: "EngSci", accent: "Academy", color: "text-emerald-500" }
                        ].map((uni, idx) => (
                            <motion.div
                                key={uni.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-zinc-300 dark:text-zinc-700 hover:text-zinc-500 dark:hover:text-zinc-500 transition-colors cursor-default"
                            >
                                <Building2 className="w-8 h-8" />
                                {uni.name}
                                <span className={uni.color}>{uni.accent}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </ScrollSection>

            {/* 4. TEAM SECTION - Enhanced visuals */}
            <ScrollSection className="py-32 px-4 bg-zinc-50 dark:bg-zinc-900/30">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid md:grid-cols-2 gap-16 items-center"
                    >
                        <div className="space-y-8">
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Our Story</span>
                            <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white">
                                The Minds Behind Qmath
                            </h2>
                            <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                Qmath was born from frustration. As engineering students, we saw brilliant minds struggle—not from lack of intelligence, but from lacking the right feedback loop.
                            </p>
                            <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                We combined cognitive science with software architecture to build a scalable, personal tutor.
                            </p>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center gap-5 p-5 bg-white dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-lg"
                            >
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <div className="text-lg font-semibold text-zinc-900 dark:text-white">The Founding Team</div>
                                    <div className="text-zinc-500">Ex-DeepMind, KTH Alumni & EdTech Veterans</div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Visual element */}
                        <motion.div
                            whileHover={{ rotate: 1 }}
                            className="relative h-[450px] w-full bg-gradient-to-br from-zinc-100 to-white dark:from-zinc-800/50 dark:to-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shadow-2xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-8 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-full opacity-30"
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-20 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-full opacity-20"
                            />
                            <div className="relative text-center z-10">
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    <BrainCircuit className="w-20 h-20 text-zinc-400 dark:text-zinc-500 mx-auto mb-6" />
                                </motion.div>
                                <div className="text-zinc-400 dark:text-zinc-500 font-mono text-lg space-y-2">
                                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.2 }}>&lt;Pedagogy /&gt;</motion.div>
                                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.4 }}>&lt;Code /&gt;</motion.div>
                                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.6 }}>&lt;Math /&gt;</motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </ScrollSection>

            <QuoteSeparator
                imageSrc="/images/fractal_growth.png"
                quote="Education is not the learning of facts, but the training of the mind to think."
                author="Albert Einstein"
            />

            {/* 5. CTA SECTION - Enhanced design */}
            <ScrollSection className="py-32 px-4 bg-white dark:bg-zinc-950">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto text-center space-y-10"
                >
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        Join Us
                    </span>
                    <h2 className="text-5xl md:text-6xl font-bold text-zinc-900 dark:text-white tracking-tight">
                        Build the Future of Education
                    </h2>
                    <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                        We're rapidly expanding our partner network. Whether you're a university dean,
                        an investor, or a brilliant engineer—we want to hear from you.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <motion.a
                            href="mailto:partners@qmath.com"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-8 py-4 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl"
                        >
                            <Mail className="w-5 h-5" />
                            Contact for Partnerships
                        </motion.a>
                        <motion.a
                            href="mailto:investors@qmath.com"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-8 py-4 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            Request Investment Deck
                        </motion.a>
                    </div>
                </motion.div>
            </ScrollSection>

            {/* FOOTER - Enhanced */}
            <footer className="py-16 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-xl text-zinc-900 dark:text-white">Qmath</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">Beta</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
                            <Link href="/features" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Features</Link>
                            <Link href="/pricing" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Pricing</Link>
                            <Link href="/about" className="hover:text-zinc-900 dark:hover:text-white transition-colors">About</Link>
                            <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy</Link>
                            <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</Link>
                        </div>
                        <p className="text-sm text-zinc-500">
                            &copy; 2026 Qmath EdTech AB
                        </p>
                    </div>
                </div>
            </footer>
        </main>
    );
}

// Enhanced Feature Card with gradient borders and icons
const iconColors: Record<string, { bg: string; text: string; glow: string }> = {
    purple: { bg: "bg-purple-500/10", text: "text-purple-500", glow: "group-hover:shadow-purple-500/20" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-500", glow: "group-hover:shadow-blue-500/20" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", glow: "group-hover:shadow-emerald-500/20" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-500", glow: "group-hover:shadow-orange-500/20" },
    pink: { bg: "bg-pink-500/10", text: "text-pink-500", glow: "group-hover:shadow-pink-500/20" },
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-500", glow: "group-hover:shadow-cyan-500/20" },
};

function FeatureCard({
    icon,
    iconColor = "blue",
    title,
    desc,
    link
}: {
    icon: React.ReactNode;
    iconColor?: string;
    title: string;
    desc: string;
    link?: string
}) {
    const colors = iconColors[iconColor] || iconColors.blue;

    const CardContent = (
        <motion.div
            variants={scaleIn}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`h-full bg-white dark:bg-zinc-900/60 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all cursor-pointer group shadow-sm hover:shadow-xl ${colors.glow}`}
        >
            <div className={`mb-5 p-3 ${colors.bg} rounded-xl inline-block group-hover:scale-110 transition-transform duration-300`}>
                <div className={colors.text}>{icon}</div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                {title}
                {link && (
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                )}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
                {desc}
            </p>
        </motion.div>
    );

    if (link) {
        return <Link href={link} className="block h-full">{CardContent}</Link>;
    }
    return CardContent;
}
