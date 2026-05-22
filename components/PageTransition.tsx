'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            key={pathname}
            initial={reduceMotion ? false : { opacity: 0.97, y: 5, scale: 0.998 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            style={{ willChange: reduceMotion ? undefined : 'opacity, transform' }}
        >
            {children}
        </motion.div>
    );
}
