"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, X, Activity } from 'lucide-react';

interface ConversationalModeProps {
    isOpen: boolean;
    onClose: () => void;
    onVoiceInput: (text: string) => void;
    isSpeaking?: boolean; // True when AI is responding
}

export function ConversationalMode({ isOpen, onClose, onVoiceInput, isSpeaking = false }: ConversationalModeProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');

    // Real implementation would use window.SpeechRecognition or a cloud API
    // We mock the "listening" UI for the demo phase.

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (isListening) {
            // Simulate listening and picking up speech
            timeout = setTimeout(() => {
                setTranscript("How do I solve the multiplication using this grid?");
                setTimeout(() => {
                    onVoiceInput("How do I solve the multiplication using this grid?");
                    setIsListening(false);
                    setTranscript("");
                }, 1500);
            }, 2000);
        }
        return () => clearTimeout(timeout);
    }, [isListening, onVoiceInput]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                >
                    <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl overflow-hidden">

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h2 className="text-xl font-medium text-white mb-2">AI Math Tutor Voice Mode</h2>
                        <p className="text-slate-400 text-sm mb-12 text-center">
                            Speak your question, and I'll update the visual grid.
                        </p>

                        {/* Voice Orb */}
                        <div className="relative w-40 h-40 mb-12 flex items-center justify-center">
                            {/* Background pulse when AI is speaking */}
                            <AnimatePresence>
                                {isSpeaking && (
                                    <motion.div
                                        key="pulse"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute inset-0 bg-cyan-500 rounded-full blur-xl"
                                    />
                                )}
                                {isListening && (
                                    <motion.div
                                        key="listening-pulse"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="absolute inset-0 bg-violet-500 rounded-full blur-xl"
                                    />
                                )}
                            </AnimatePresence>

                            {/* Main Orb Button */}
                            <button
                                onClick={() => setIsListening(!isListening)}
                                className={`
                    relative z-10 w-32 h-32 rounded-full flex items-center justify-center shadow-lg transition-all
                    ${isSpeaking
                                        ? 'bg-gradient-to-tr from-cyan-600 to-cyan-400 border border-cyan-300'
                                        : isListening
                                            ? 'bg-gradient-to-tr from-violet-600 to-violet-400 border border-violet-300'
                                            : 'bg-slate-800 border-2 border-slate-700 hover:border-slate-500'}
                  `}
                            >
                                {isSpeaking ? (
                                    <Volume2 className="w-12 h-12 text-white" />
                                ) : isListening ? (
                                    <Activity className="w-12 h-12 text-white animate-pulse" />
                                ) : (
                                    <Mic className="w-12 h-12 text-slate-300" />
                                )}
                            </button>
                        </div>

                        <div className="h-16 flex items-center justify-center px-4 w-full">
                            <AnimatePresence mode="wait">
                                {transcript && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-white text-lg font-medium text-center"
                                    >
                                        "{transcript}"
                                    </motion.p>
                                )}
                                {!transcript && isSpeaking && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-cyan-400 text-lg text-center"
                                    >
                                        Explaining visual steps...
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
