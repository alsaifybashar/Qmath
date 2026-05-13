'use client';

import { useState, useEffect } from 'react';

export default function ReadingProgressBar() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const update = () => {
            const scrollable = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(scrollable > 0 ? window.scrollY / scrollable : 0);
        };

        window.addEventListener('scroll', update, { passive: true });
        update();
        return () => window.removeEventListener('scroll', update);
    }, []);

    return (
        <div
            className="fixed top-0 left-0 right-0 pointer-events-none"
            style={{ height: '2px', zIndex: 50 }}
        >
            <div
                className="h-full origin-left"
                style={{
                    transform: `scaleX(${progress})`,
                    willChange: 'transform',
                    transition: 'transform 75ms linear',
                    background: 'linear-gradient(to right, #4361EE, #7C5CFC)',
                }}
            />
        </div>
    );
}
