'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { motionDuration, motionEase } from '@/lib/motion';

export function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const reduceMotion = useReducedMotion();
    const instant = reduceMotion || pathname.startsWith('/study');

    return (
        <motion.div
            key={pathname}
            initial={instant ? false : { opacity: 0.97, transform: 'translateY(5px) scale(0.998)' }}
            animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
            transition={{ duration: instant ? 0 : motionDuration.press, ease: motionEase.out }}
            style={{ willChange: instant ? undefined : 'opacity, transform' }}
        >
            {children}
        </motion.div>
    );
}
