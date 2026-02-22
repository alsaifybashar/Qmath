'use client';

import { motion } from 'framer-motion';

export type AlienMood = 'idle' | 'happy' | 'cheering' | 'thinking' | 'sad' | 'sleeping' | 'excited' | 'waving';

interface QlixAlienProps {
    mood?: AlienMood;
    size?: number;
    className?: string;
    onClick?: () => void;
}

/**
 * Qlix — the green alien mascot of Qmath.
 * A cute, glowing alien rendered entirely with SVG.
 * Supports multiple moods/expressions.
 */
export function QlixAlien({ mood = 'idle', size = 80, className = '', onClick }: QlixAlienProps) {
    const eyeVariants: Record<AlienMood, { leftPupilX: number; leftPupilY: number; rightPupilX: number; rightPupilY: number; scaleY?: number }> = {
        idle: { leftPupilX: 35, leftPupilY: 42, rightPupilX: 65, rightPupilY: 42 },
        happy: { leftPupilX: 35, leftPupilY: 40, rightPupilX: 65, rightPupilY: 40, scaleY: 0.7 },
        cheering: { leftPupilX: 35, leftPupilY: 38, rightPupilX: 65, rightPupilY: 38 },
        thinking: { leftPupilX: 38, leftPupilY: 39, rightPupilX: 68, rightPupilY: 39 },
        sad: { leftPupilX: 35, leftPupilY: 45, rightPupilX: 65, rightPupilY: 45 },
        sleeping: { leftPupilX: 35, leftPupilY: 42, rightPupilX: 65, rightPupilY: 42, scaleY: 0.1 },
        excited: { leftPupilX: 35, leftPupilY: 40, rightPupilX: 65, rightPupilY: 40 },
        waving: { leftPupilX: 33, leftPupilY: 40, rightPupilX: 63, rightPupilY: 40 },
    };

    const eyes = eyeVariants[mood];
    const eyeScaleY = eyes.scaleY ?? 1;

    // Mouth shapes per mood
    const mouthPath: Record<AlienMood, string> = {
        idle: 'M 40 60 Q 50 65, 60 60',
        happy: 'M 37 58 Q 50 70, 63 58',
        cheering: 'M 38 57 Q 50 72, 62 57',
        thinking: 'M 43 61 Q 50 63, 57 61',
        sad: 'M 40 64 Q 50 58, 60 64',
        sleeping: 'M 43 62 Q 50 65, 57 62',
        excited: 'M 36 57 Q 50 73, 64 57',
        waving: 'M 38 58 Q 50 68, 62 58',
    };

    // Body bounce for certain moods
    const bounceAnim = mood === 'cheering' || mood === 'excited'
        ? { y: [0, -6, 0], transition: { repeat: Infinity, duration: 0.6, ease: 'easeInOut' as const } }
        : mood === 'idle'
            ? { y: [0, -3, 0], transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' as const } }
            : {};

    return (
        <motion.div
            className={`cursor-pointer select-none ${className}`}
            style={{ width: size, height: size }}
            onClick={onClick}
            animate={bounceAnim}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
        >
            <svg
                viewBox="0 0 100 100"
                width={size}
                height={size}
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    {/* Body glow */}
                    <radialGradient id={`bodyGlow-${mood}`} cx="50%" cy="40%" r="55%">
                        <stop offset="0%" stopColor="#86efac" />
                        <stop offset="55%" stopColor="#4ade80" />
                        <stop offset="100%" stopColor="#22c55e" />
                    </radialGradient>

                    {/* Eye glow */}
                    <radialGradient id={`eyeGlow-${mood}`} cx="50%" cy="45%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#e0f2fe" />
                    </radialGradient>

                    {/* Outer glow filter */}
                    <filter id={`alienGlow-${mood}`} x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="3" result="glow" />
                        <feMerge>
                            <feMergeNode in="glow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Antenna tip glow */}
                    <filter id={`tipGlow-${mood}`} x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="2.5" result="glow" />
                        <feMerge>
                            <feMergeNode in="glow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* ─── Antennae ─── */}
                {/* Left antenna */}
                <motion.g
                    animate={mood === 'excited' || mood === 'cheering'
                        ? { rotate: [0, -8, 0, 8, 0], transition: { repeat: Infinity, duration: 0.8 } }
                        : { rotate: [0, -3, 0], transition: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' as const } }
                    }
                    style={{ transformOrigin: '35px 20px' }}
                >
                    <path d="M 35 25 Q 28 8, 22 5" stroke="#4ade80" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <circle cx="22" cy="5" r="3.5" fill="#67e8f9" filter={`url(#tipGlow-${mood})`}>
                        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                </motion.g>

                {/* Right antenna */}
                <motion.g
                    animate={mood === 'excited' || mood === 'cheering'
                        ? { rotate: [0, 8, 0, -8, 0], transition: { repeat: Infinity, duration: 0.8 } }
                        : { rotate: [0, 3, 0], transition: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' as const } }
                    }
                    style={{ transformOrigin: '65px 20px' }}
                >
                    <path d="M 65 25 Q 72 8, 78 5" stroke="#4ade80" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <circle cx="78" cy="5" r="3.5" fill="#67e8f9" filter={`url(#tipGlow-${mood})`}>
                        <animate attributeName="opacity" values="1;0.7;1" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                </motion.g>

                {/* ─── Head / Body (unified oval) ─── */}
                <ellipse
                    cx="50"
                    cy="50"
                    rx="32"
                    ry="36"
                    fill={`url(#bodyGlow-${mood})`}
                    filter={`url(#alienGlow-${mood})`}
                    stroke="#22c55e"
                    strokeWidth="1"
                />

                {/* Bioluminescent markings */}
                <ellipse cx="38" cy="70" rx="6" ry="3" fill="#86efac" opacity="0.4" />
                <ellipse cx="62" cy="70" rx="6" ry="3" fill="#86efac" opacity="0.4" />
                <circle cx="50" cy="75" r="2.5" fill="#86efac" opacity="0.3" />

                {/* Belly highlight */}
                <ellipse cx="50" cy="55" rx="15" ry="18" fill="#bbf7d0" opacity="0.3" />

                {/* ─── Eyes ─── */}
                {/* Left eye */}
                <motion.g style={{ transformOrigin: '35px 42px' }} animate={{ scaleY: eyeScaleY }}>
                    <ellipse cx="35" cy="42" rx="10" ry="11" fill={`url(#eyeGlow-${mood})`} stroke="#d1fae5" strokeWidth="0.5" />
                    {/* Iris */}
                    <circle cx={eyes.leftPupilX} cy={eyes.leftPupilY} r="5.5" fill="#06b6d4" />
                    {/* Pupil */}
                    <circle cx={eyes.leftPupilX} cy={eyes.leftPupilY} r="3" fill="#0e7490" />
                    {/* Sparkle */}
                    <circle cx={eyes.leftPupilX - 2} cy={eyes.leftPupilY - 2} r="1.5" fill="white" opacity="0.9" />
                </motion.g>

                {/* Right eye */}
                <motion.g style={{ transformOrigin: '65px 42px' }} animate={{ scaleY: eyeScaleY }}>
                    <ellipse cx="65" cy="42" rx="10" ry="11" fill={`url(#eyeGlow-${mood})`} stroke="#d1fae5" strokeWidth="0.5" />
                    <circle cx={eyes.rightPupilX} cy={eyes.rightPupilY} r="5.5" fill="#06b6d4" />
                    <circle cx={eyes.rightPupilX} cy={eyes.rightPupilY} r="3" fill="#0e7490" />
                    <circle cx={eyes.rightPupilX - 2} cy={eyes.rightPupilY - 2} r="1.5" fill="white" opacity="0.9" />
                </motion.g>

                {/* Blush spots */}
                {(mood === 'happy' || mood === 'cheering' || mood === 'excited') && (
                    <>
                        <circle cx="22" cy="50" r="4" fill="#f9a8d4" opacity="0.3" />
                        <circle cx="78" cy="50" r="4" fill="#f9a8d4" opacity="0.3" />
                    </>
                )}

                {/* ─── Mouth ─── */}
                <motion.path
                    d={mouthPath[mood]}
                    fill="none"
                    stroke={mood === 'sad' ? '#15803d' : '#166534'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={false}
                    animate={{ d: mouthPath[mood] }}
                    transition={{ duration: 0.3 }}
                />

                {/* Open mouth for cheering/excited */}
                {(mood === 'cheering' || mood === 'excited') && (
                    <ellipse cx="50" cy="63" rx="7" ry="5" fill="#15803d" opacity="0.8" />
                )}

                {/* ─── Arms ─── */}
                {/* Left arm */}
                <motion.path
                    d={mood === 'waving'
                        ? 'M 22 55 Q 10 45, 8 35'
                        : mood === 'cheering'
                            ? 'M 22 55 Q 8 42, 5 30'
                            : 'M 22 55 Q 12 62, 10 72'
                    }
                    stroke="#4ade80"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    animate={mood === 'waving'
                        ? { d: ['M 22 55 Q 10 45, 8 35', 'M 22 55 Q 8 40, 5 28', 'M 22 55 Q 10 45, 8 35'] }
                        : undefined
                    }
                    transition={mood === 'waving' ? { repeat: Infinity, duration: 0.7, ease: 'easeInOut' as const } : undefined}
                />
                {/* Left hand */}
                <motion.circle
                    cx={mood === 'waving' ? 8 : mood === 'cheering' ? 5 : 10}
                    cy={mood === 'waving' ? 35 : mood === 'cheering' ? 30 : 72}
                    r="3.5"
                    fill="#86efac"
                    stroke="#4ade80"
                    strokeWidth="1"
                />

                {/* Right arm */}
                <motion.path
                    d={mood === 'cheering'
                        ? 'M 78 55 Q 92 42, 95 30'
                        : mood === 'thinking'
                            ? 'M 78 55 Q 85 50, 83 42'
                            : 'M 78 55 Q 88 62, 90 72'
                    }
                    stroke="#4ade80"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                />
                {/* Right hand */}
                <circle
                    cx={mood === 'cheering' ? 95 : mood === 'thinking' ? 83 : 90}
                    cy={mood === 'cheering' ? 30 : mood === 'thinking' ? 42 : 72}
                    r="3.5"
                    fill="#86efac"
                    stroke="#4ade80"
                    strokeWidth="1"
                />

                {/* Thinking dots */}
                {mood === 'thinking' && (
                    <>
                        <circle cx="88" cy="35" r="2" fill="#67e8f9" opacity="0.6">
                            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="92" cy="28" r="1.5" fill="#67e8f9" opacity="0.5">
                            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.2s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="95" cy="22" r="1" fill="#67e8f9" opacity="0.4">
                            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1s" repeatCount="indefinite" />
                        </circle>
                    </>
                )}

                {/* Sleeping Z's */}
                {mood === 'sleeping' && (
                    <motion.g
                        animate={{ y: [0, -8], opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' as const }}
                    >
                        <text x="70" y="30" fontSize="10" fill="#67e8f9" fontWeight="bold">Z</text>
                        <text x="78" y="22" fontSize="7" fill="#67e8f9" fontWeight="bold" opacity="0.6">z</text>
                        <text x="84" y="16" fontSize="5" fill="#67e8f9" fontWeight="bold" opacity="0.3">z</text>
                    </motion.g>
                )}

                {/* ─── Feet ─── */}
                <ellipse cx="38" cy="86" rx="8" ry="4" fill="#22c55e" />
                <ellipse cx="62" cy="86" rx="8" ry="4" fill="#22c55e" />

                {/* Stars around for excited/cheering */}
                {(mood === 'excited' || mood === 'cheering') && (
                    <motion.g
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 4, ease: 'linear' as const }}
                        style={{ transformOrigin: '50px 50px' }}
                    >
                        <text x="5" y="30" fontSize="8" fill="#fbbf24">✦</text>
                        <text x="88" y="25" fontSize="6" fill="#67e8f9">✦</text>
                        <text x="10" y="75" fontSize="5" fill="#a78bfa">✦</text>
                        <text x="90" y="80" fontSize="7" fill="#fbbf24">✦</text>
                    </motion.g>
                )}
            </svg>
        </motion.div>
    );
}
