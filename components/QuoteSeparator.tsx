'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';

interface QuoteSeparatorProps {
    imageSrc: string;
    quote: string;
    author: string;
    position?: 'left' | 'right' | 'center';
}

export function QuoteSeparator({ imageSrc, quote, author, position = 'center' }: QuoteSeparatorProps) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    // Parallax effect for the image
    const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return (
        <div ref={ref} className="relative w-full h-[500px] md:h-[600px] overflow-hidden flex items-end justify-start my-12 md:my-24 group">
            {/* Background Parallax Image */}
            <motion.div
                style={{ y }}
                className="absolute inset-0 w-full h-[120%] -top-[10%]"
            >
                <Image
                    src={imageSrc}
                    alt="Artistic interpretation"
                    fill
                    className="object-cover brightness-[0.8] transition-all duration-700"
                    priority={false}
                />
            </motion.div>

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-0 pointer-events-none" />

            {/* Quote Overlay - Left aligned, clean sans-serif, no italic/bold */}
            <motion.div
                style={{ opacity }}
                className="relative z-10 max-w-4xl px-8 pb-16 md:px-20 md:pb-24 text-left"
            >
                <h3 className="text-2xl md:text-4xl font-normal text-white mb-6 leading-tight font-sans tracking-wide">
                    {quote}
                </h3>
                <p className="text-xs md:text-sm text-zinc-300 font-medium tracking-[0.2em] uppercase">
                    {author}
                </p>
            </motion.div>
        </div>
    );
}
