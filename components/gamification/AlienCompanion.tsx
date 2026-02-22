'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Flame, Trophy, Star, MessageCircle } from 'lucide-react';
import { QlixAlien, type AlienMood } from './QlixAlien';

// ─── Message types ───────────────────────────────────────────────────────────
export interface AlienMessage {
    text: string;
    mood: AlienMood;
    duration?: number; // ms, default 5000
    priority?: 'low' | 'normal' | 'high';
    icon?: 'xp' | 'streak' | 'trophy' | 'star' | 'sparkle';
}

// ─── Contextual messages for different scenarios ────────────────────────────
const IDLE_MESSAGES: AlienMessage[] = [
    { text: 'Redo att lösa lite matte? 🧮', mood: 'waving' },
    { text: 'Klicka på mig om du vill ha tips!', mood: 'happy' },
    { text: 'Du gör det bra! Fortsätt så! 💪', mood: 'cheering' },
    { text: 'Visste du att repetition är nyckeln till framgång?', mood: 'thinking' },
    { text: 'Jag tror på dig! 🌟', mood: 'happy' },
    { text: 'Ska vi ta en matteövning?', mood: 'excited' },
    { text: 'Konsistens slår allt — plugga lite varje dag!', mood: 'thinking' },
    { text: 'Hej! Jag är Qlix, din studiequmpan!', mood: 'waving' },
];

const CORRECT_ANSWER_MESSAGES: AlienMessage[] = [
    { text: 'Fantastiskt! Du är grym! 🎉', mood: 'cheering', icon: 'sparkle' },
    { text: 'Rätt! Du fixar det här! ✨', mood: 'excited', icon: 'xp' },
    { text: 'Perfekt! Snyggt jobbat!', mood: 'happy', icon: 'star' },
    { text: 'Wohooo! Rätt svar! 🚀', mood: 'cheering', icon: 'sparkle' },
    { text: 'Du är en mattehjälte!! 🦸', mood: 'excited', icon: 'trophy' },
];

const WRONG_ANSWER_MESSAGES: AlienMessage[] = [
    { text: 'Ge det ett försök till! Du kan! 💪', mood: 'thinking' },
    { text: 'Ingen fara, misstag hjälper dig lära!', mood: 'happy' },
    { text: 'Hmm, titta noga — du är nära!', mood: 'thinking' },
    { text: 'Det är okej! Prova en annan approach 🤔', mood: 'thinking' },
];

const STREAK_MESSAGES: Record<number, AlienMessage> = {
    3: { text: '3 rätt i rad! Du har momentum! 🔥', mood: 'cheering', icon: 'streak', duration: 4000 },
    5: { text: '5 i rad! Du är ostoppbar!! ⚡', mood: 'excited', icon: 'streak', duration: 5000 },
    10: { text: '10 i rad! LEGENDÄRT! 🏆', mood: 'cheering', icon: 'trophy', duration: 6000 },
};

const INACTIVITY_MESSAGES: AlienMessage[] = [
    { text: 'Hej, jag väntar här! Ska vi plugga? 📚', mood: 'waving' },
    { text: '*gäspar* … är du kvar? 😴', mood: 'sleeping' },
    { text: 'Tips: 15 minuter om dagen gör underverk!', mood: 'thinking' },
];

// ─── Icon component map ─────────────────────────────────────────────────────
function MessageIcon({ icon }: { icon?: string }) {
    switch (icon) {
        case 'xp': return <Zap className="w-3.5 h-3.5 text-violet-400" />;
        case 'streak': return <Flame className="w-3.5 h-3.5 text-orange-400" />;
        case 'trophy': return <Trophy className="w-3.5 h-3.5 text-amber-400" />;
        case 'star': return <Star className="w-3.5 h-3.5 text-yellow-400" />;
        case 'sparkle': return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
        default: return null;
    }
}

// ─── Main Component ──────────────────────────────────────────────────────────
interface AlienCompanionProps {
    /** Override current mood externally */
    mood?: AlienMood;
    /** Show a specific message */
    message?: AlienMessage | null;
    /** Called when the alien is clicked */
    onInteract?: () => void;
    /** Position */
    position?: 'bottom-right' | 'bottom-left';
    /** Hide companion entirely */
    hidden?: boolean;
}

export function AlienCompanion({
    mood: externalMood,
    message: externalMessage,
    onInteract,
    position = 'bottom-right',
    hidden = false,
}: AlienCompanionProps) {
    const [currentMessage, setCurrentMessage] = useState<AlienMessage | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [interactionCount, setInteractionCount] = useState(0);
    const [currentMood, setCurrentMood] = useState<AlienMood>('idle');
    const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);


    // Handle external message changes
    useEffect(() => {
        if (externalMessage) {
            showMessage(externalMessage);
        }
    }, [externalMessage]); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle external mood changes
    useEffect(() => {
        if (externalMood) {
            setCurrentMood(externalMood);
        }
    }, [externalMood]);

    // Idle message timer
    useEffect(() => {
        const scheduleIdleMessage = () => {
            idleTimeoutRef.current = setTimeout(() => {
                if (!currentMessage) {
                    const msg = INACTIVITY_MESSAGES[Math.floor(Math.random() * INACTIVITY_MESSAGES.length)];
                    showMessage(msg);
                }
                scheduleIdleMessage();
            }, 120_000 + Math.random() * 60_000); // 2-3 minutes
        };

        scheduleIdleMessage();
        return () => {
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Initial greeting
    useEffect(() => {
        const greeting = setTimeout(() => {
            showMessage({
                text: 'Hej! Jag är Qlix 👽 din studiequmpan! Klicka på mig för tips!',
                mood: 'waving',
                duration: 6000,
            });
        }, 2000);
        return () => clearTimeout(greeting);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const showMessage = useCallback((msg: AlienMessage) => {
        if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
        setCurrentMessage(msg);
        setCurrentMood(msg.mood);

        messageTimeoutRef.current = setTimeout(() => {
            setCurrentMessage(null);
            setCurrentMood('idle');
        }, msg.duration || 5000);
    }, []);

    const handleClick = useCallback(() => {
        setInteractionCount(prev => prev + 1);
        onInteract?.();

        // Show a random idle message on click
        const msg = IDLE_MESSAGES[interactionCount % IDLE_MESSAGES.length];
        showMessage(msg);
    }, [interactionCount, onInteract, showMessage]);

    if (hidden) return null;

    const positionClasses = position === 'bottom-right'
        ? 'right-4 sm:right-6 bottom-4 sm:bottom-6'
        : 'left-4 sm:left-6 bottom-4 sm:bottom-6';

    return (
        <motion.div
            className={`fixed ${positionClasses} z-[100] flex flex-col items-end gap-2`}
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 1 }}
        >
            {/* ─── Speech Bubble ─── */}
            <AnimatePresence>
                {currentMessage && !isMinimized && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="relative max-w-[260px] sm:max-w-[280px]"
                    >
                        <div className="relative bg-white dark:bg-zinc-800 rounded-2xl rounded-br-md px-4 py-3 shadow-lg shadow-black/10 dark:shadow-black/30 border border-zinc-100 dark:border-zinc-700">
                            {/* Close button */}
                            <button
                                onClick={() => setCurrentMessage(null)}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-full flex items-center justify-center transition-colors"
                            >
                                <X className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                            </button>

                            <div className="flex items-start gap-2">
                                {currentMessage.icon && (
                                    <div className="mt-0.5 flex-shrink-0">
                                        <MessageIcon icon={currentMessage.icon} />
                                    </div>
                                )}
                                <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed font-medium">
                                    {currentMessage.text}
                                </p>
                            </div>
                        </div>

                        {/* Speech bubble tail */}
                        <div className="absolute -bottom-[6px] right-6 w-3 h-3 bg-white dark:bg-zinc-800 border-b border-r border-zinc-100 dark:border-zinc-700 transform rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Alien Character ─── */}
            <motion.div
                className="relative group"
                drag
                dragConstraints={{ top: -400, left: -400, right: 100, bottom: 100 }}
                dragElastic={0.1}
                dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
            >
                {/* Glow ring behind alien */}
                <div className="absolute inset-0 -m-2 rounded-full bg-gradient-to-tr from-green-400/20 to-cyan-400/20 blur-xl group-hover:from-green-400/30 group-hover:to-cyan-400/30 transition-all duration-500" />

                {/* Platform / base */}
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-14 h-3 bg-gradient-to-r from-green-500/20 via-green-400/40 to-green-500/20 rounded-full blur-sm" />

                {/* Minimize button */}
                <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="absolute -top-1 -right-1 z-10 w-5 h-5 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                    title={isMinimized ? 'Visa Qlix' : 'Minimera Qlix'}
                >
                    {isMinimized ? (
                        <MessageCircle className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                    ) : (
                        <X className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                    )}
                </button>

                {isMinimized ? (
                    <motion.button
                        onClick={() => setIsMinimized(false)}
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/25 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                        whileHover={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.4 }}
                    >
                        <span className="text-lg">👽</span>
                    </motion.button>
                ) : (
                    <QlixAlien
                        mood={currentMood}
                        size={72}
                        onClick={handleClick}
                    />
                )}

                {/* Notification dot when minimized */}
                {isMinimized && currentMessage && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900"
                    />
                )}
            </motion.div>
        </motion.div>
    );
}

// ─── Export helper functions for triggering messages from other components ───
export { CORRECT_ANSWER_MESSAGES, WRONG_ANSWER_MESSAGES, STREAK_MESSAGES, IDLE_MESSAGES, INACTIVITY_MESSAGES };
