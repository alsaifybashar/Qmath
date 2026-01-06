'use client';

import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { useRef } from 'react';

interface ScrollSectionProps {
    children: React.ReactNode;
    className?: string;
}

export function ScrollSection({ children, className = "" }: ScrollSectionProps) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    // "Apple-style" revealing effect
    // Starts slightly scaled down and lower, and transparent
    // As it hits the center of the view, it becomes fully opaque, scaled 1, and raised.
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [0, 1, 1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [0.95, 1]);
    const y = useTransform(scrollYProgress, [0, 0.2], [100, 0]);

    return (
        <motion.div
            ref={ref}
            style={{ opacity, scale, y }}
            className={`relative z-10 ${className}`}
        >
            {children}
        </motion.div>
    );
}

// A connector line component that grows as you scroll
export function ScrollConnector() {
    const { scrollYProgress } = useScroll();
    const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

    return (
        <div className="absolute left-[50%] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-blue-500/20 to-transparent -translate-x-1/2 hidden md:block z-0">
            <motion.div
                style={{ scaleY, transformOrigin: "top" }}
                className="w-full h-full bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            />
        </div>
    )
}
