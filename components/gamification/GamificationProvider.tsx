'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Trophy, Star, TrendingUp } from 'lucide-react';
import { AlienCompanion, type AlienMessage, CORRECT_ANSWER_MESSAGES, WRONG_ANSWER_MESSAGES, STREAK_MESSAGES } from './AlienCompanion';
import type { AlienMood } from './QlixAlien';

// ─── Types ───────────────────────────────────────────────────────────────────
interface XPNotification {
    id: string;
    amount: number;
    reason: string;
    timestamp: number;
}

interface LevelUpNotification {
    level: number;
    title: string;
}

interface GamificationContextType {
    // XP
    notifyXP: (amount: number, reason: string) => void;

    // Level up
    notifyLevelUp: (level: number, title: string) => void;

    // Alien companion
    sendAlienMessage: (message: AlienMessage) => void;
    setAlienMood: (mood: AlienMood) => void;

    // Events
    onCorrectAnswer: (streak?: number) => void;
    onWrongAnswer: () => void;
    onAchievement: (name: string) => void;
    onSessionComplete: (correct: number, total: number) => void;
    onStreakMilestone: (count: number) => void;

    // Visibility
    hideCompanion: boolean;
    setHideCompanion: (hide: boolean) => void;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export function useGamification() {
    const ctx = useContext(GamificationContext);
    if (!ctx) {
        // Return a no-op version to avoid crashes when used outside the provider
        return {
            notifyXP: () => { },
            notifyLevelUp: () => { },
            sendAlienMessage: () => { },
            setAlienMood: () => { },
            onCorrectAnswer: () => { },
            onWrongAnswer: () => { },
            onAchievement: () => { },
            onSessionComplete: () => { },
            onStreakMilestone: () => { },
            hideCompanion: false,
            setHideCompanion: () => { },
        } as GamificationContextType;
    }
    return ctx;
}

// ─── Provider Component ──────────────────────────────────────────────────────
export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const [xpNotifications, setXpNotifications] = useState<XPNotification[]>([]);
    const [levelUpNotif, setLevelUpNotif] = useState<LevelUpNotification | null>(null);
    const [alienMessage, setAlienMessage] = useState<AlienMessage | null>(null);
    const [alienMood, setAlienMood] = useState<AlienMood>('idle');
    const [hideCompanion, setHideCompanion] = useState(false);
    const notifIdRef = useRef(0);

    // Auto-clear XP notifications
    useEffect(() => {
        if (xpNotifications.length > 0) {
            const timer = setTimeout(() => {
                setXpNotifications(prev => prev.slice(1));
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [xpNotifications]);

    // Auto-clear level-up notification
    useEffect(() => {
        if (levelUpNotif) {
            const timer = setTimeout(() => setLevelUpNotif(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [levelUpNotif]);

    const notifyXP = useCallback((amount: number, reason: string) => {
        const id = `xp-${++notifIdRef.current}`;
        setXpNotifications(prev => [...prev, { id, amount, reason, timestamp: Date.now() }]);
    }, []);

    const notifyLevelUp = useCallback((level: number, title: string) => {
        setLevelUpNotif({ level, title });
        setAlienMessage({
            text: `Grattis! Du nådde nivå ${level} — ${title}! 🎉🚀`,
            mood: 'cheering',
            icon: 'trophy',
            duration: 6000,
        });
    }, []);

    const sendAlienMessage = useCallback((message: AlienMessage) => {
        setAlienMessage(message);
    }, []);

    const onCorrectAnswer = useCallback((streak?: number) => {
        // Pick a random correct answer message
        const msg = CORRECT_ANSWER_MESSAGES[Math.floor(Math.random() * CORRECT_ANSWER_MESSAGES.length)];
        setAlienMessage(msg);

        // Check streak milestones
        if (streak && STREAK_MESSAGES[streak]) {
            setTimeout(() => {
                setAlienMessage(STREAK_MESSAGES[streak]);
            }, 2000);
        }
    }, []);

    const onWrongAnswer = useCallback(() => {
        const msg = WRONG_ANSWER_MESSAGES[Math.floor(Math.random() * WRONG_ANSWER_MESSAGES.length)];
        setAlienMessage(msg);
    }, []);

    const onAchievement = useCallback((name: string) => {
        setAlienMessage({
            text: `🏆 Achievement unlocked: ${name}! Du är fantastisk!`,
            mood: 'cheering',
            icon: 'trophy',
            duration: 6000,
        });
    }, []);

    const onSessionComplete = useCallback((correct: number, total: number) => {
        const ratio = total > 0 ? correct / total : 0;
        if (ratio >= 0.9) {
            setAlienMessage({
                text: `Oj! ${correct}/${total} rätt! Du är en mattemaskin! 🤖✨`,
                mood: 'cheering',
                icon: 'trophy',
                duration: 6000,
            });
        } else if (ratio >= 0.7) {
            setAlienMessage({
                text: `Snyggt! ${correct}/${total} — du förbättras hela tiden! 📈`,
                mood: 'happy',
                icon: 'star',
                duration: 5000,
            });
        } else {
            setAlienMessage({
                text: `${correct}/${total} den här gången. Övning ger färdighet! 💪`,
                mood: 'thinking',
                duration: 5000,
            });
        }
    }, []);

    const onStreakMilestone = useCallback((count: number) => {
        if (STREAK_MESSAGES[count]) {
            setAlienMessage(STREAK_MESSAGES[count]);
        }
    }, []);

    const contextValue: GamificationContextType = {
        notifyXP,
        notifyLevelUp,
        sendAlienMessage,
        setAlienMood,
        onCorrectAnswer,
        onWrongAnswer,
        onAchievement,
        onSessionComplete,
        onStreakMilestone,
        hideCompanion,
        setHideCompanion,
    };

    return (
        <GamificationContext.Provider value={contextValue}>
            {children}

            {/* ─── XP Toast Notifications ─── */}
            <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {xpNotifications.map((notif) => (
                        <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: 80, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 40, scale: 0.9 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-violet-500/90 to-purple-600/90 backdrop-blur-md rounded-xl shadow-lg shadow-violet-500/25 text-white"
                        >
                            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Zap className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="font-bold text-sm">+{notif.amount} XP</span>
                                <span className="text-xs text-violet-200 ml-1.5">{notif.reason}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* ─── Level Up Modal ─── */}
            <AnimatePresence>
                {levelUpNotif && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        onClick={() => setLevelUpNotif(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                            className="relative max-w-sm w-full mx-4 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-center shadow-2xl shadow-violet-500/30 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Decorative elements */}
                            <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-white/10 blur-xl" />

                            {/* Stars burst */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1, rotate: 180 }}
                                transition={{ delay: 0.2, duration: 1 }}
                                className="absolute inset-0 flex items-center justify-center opacity-20"
                            >
                                {[...Array(8)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                                        transition={{ delay: 0.3 + i * 0.1, duration: 2, repeat: Infinity }}
                                        className="absolute"
                                        style={{
                                            transform: `rotate(${i * 45}deg) translateY(-60px)`,
                                        }}
                                    >
                                        <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                                    </motion.div>
                                ))}
                            </motion.div>

                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', delay: 0.15, damping: 10 }}
                                className="relative z-10"
                            >
                                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-xl shadow-amber-500/30 flex items-center justify-center">
                                    <TrendingUp className="w-10 h-10 text-white" />
                                </div>

                                <h2 className="text-2xl font-bold text-white mb-1">Nivå {levelUpNotif.level}!</h2>
                                <p className="text-violet-200 text-lg font-medium mb-4">{levelUpNotif.title}</p>

                                <div className="flex items-center justify-center gap-1.5 mb-6">
                                    {[...Array(levelUpNotif.level)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.4 + i * 0.08 }}
                                        >
                                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                        </motion.div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setLevelUpNotif(null)}
                                    className="px-8 py-3 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-xl text-white font-semibold transition-colors"
                                >
                                    Häftigt! 🚀
                                </button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Alien Companion ─── */}
            <AlienCompanion
                mood={alienMood}
                message={alienMessage}
                hidden={hideCompanion}
            />
        </GamificationContext.Provider>
    );
}
