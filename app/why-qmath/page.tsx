'use client';

import { Header } from '@/components/Header';
import { motion, useScroll, useTransform } from 'framer-motion';
import { BrainCircuit, Target, Zap, BarChart3, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useRef } from 'react';

// Reusable Section Component mimicking the Whoop style (Image + Text split)
function FeatureSection({
    title,
    subtitle,
    description,
    imageSrc,
    reversed = false,
    color = "blue"
}: {
    title: string;
    subtitle: string;
    description: string;
    imageSrc: string;
    reversed?: boolean;
    color?: "blue" | "green" | "purple" | "orange";
}) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.8, 1], [0, 1, 1, 0]);

    return (
        <div ref={ref} className="min-h-screen flex items-center justify-center p-6 md:p-12 overflow-hidden">
            <div className={`max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center ${reversed ? 'lg:grid-flow-row-dense' : ''}`}>

                {/* Text Content */}
                <motion.div
                    style={{ opacity }}
                    className={`flex flex-col justify-center space-y-8 ${reversed ? 'lg:col-start-2' : ''}`}
                >
                    <div className="space-y-4">
                        <div className={`text-xl font-bold tracking-widest uppercase text-${color}-500`}>
                            {subtitle}
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                            {title}
                        </h2>
                        <div className={`h-1 w-20 bg-${color}-500 rounded-full`}></div>
                    </div>
                    <p className="text-xl text-zinc-400 leading-relaxed max-w-lg">
                        {description}
                    </p>
                </motion.div>

                {/* Visual Content */}
                <div className={`relative h-[500px] md:h-[600px] w-full rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 ${reversed ? 'lg:col-start-1' : ''}`}>
                    <Image
                        src={imageSrc}
                        alt={title}
                        fill
                        className="object-cover opacity-80"
                    />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                </div>
            </div>
        </div>
    );
}

export default function WhyQmathPage() {
    return (
        <div className="bg-black text-white min-h-screen font-sans selection:bg-blue-500/30">
            <Header />

            {/* HERO SECTION */}
            <section className="relative h-screen flex flex-col items-center justify-center text-center px-4 pt-20">
                <div className="max-w-4xl mx-auto space-y-6 z-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-8xl font-bold tracking-tight"
                    >
                        Learn like <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                            you live.
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto"
                    >
                        Qmath decodes your learning patterns to maximize retention and minimize study time.
                    </motion.p>
                </div>

                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-12 animate-bounce text-zinc-500"
                >
                    <ChevronDown className="w-8 h-8" />
                </motion.div>
            </section>

            {/* SECTION 1: EFFICENCY */}
            <FeatureSection
                subtitle="Velocity Tracking"
                title="Stop guessing. Start mastering."
                description="Most students waste 60% of their time on problems they already know or are not ready for. Qmath calculates your optimal 'Learning Velocity' to serve the exact problem you need right now."
                imageSrc="/images/math_nebula.png"
                color="blue"
            />

            {/* SECTION 2: PERSONALIZATION */}
            <FeatureSection
                subtitle="Adaptive Intelligence"
                title="Understand your unique brain."
                description="We don't just grade your answers. We model your cognitive state. Our algorithm detects if you're struggling with the concept or just a calculation error, adapting the path instantly."
                imageSrc="/images/fractal_growth.png"
                reversed={true}
                color="green"

            />

            {/* SECTION 3: READINESS */}
            <FeatureSection
                subtitle="Exam Simulation"
                title="Walk into the exam ready."
                description="Get daily insights into your exam probability. We track your stress resistance and problem-solving speed under pressure, ensuring you peak exactly on exam day."
                imageSrc="/images/engineering_bridge.png"
                color="purple"
            />

            {/* CTA FOOTER */}
            <div className="py-32 text-center">
                <h2 className="text-4xl md:text-6xl font-bold mb-8">Unlock your potential.</h2>
                <button className="px-10 py-5 bg-white text-black text-lg font-bold rounded-full hover:scale-105 transition-transform">
                    Join Qmath Today
                </button>
            </div>
        </div>
    );
}
