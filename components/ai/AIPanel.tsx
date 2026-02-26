'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Minimize2, Maximize2, Loader2, Sparkles, LayoutGrid, Mic } from 'lucide-react';
import { AIGraph } from './AIGraph';
import { GridMultiplier } from '../interactive/GridMultiplier';
import { ColumnAddition } from '../interactive/ColumnAddition';
import { CalculusTangent } from '../interactive/CalculusTangent';
import { VectorSpace } from '../interactive/VectorSpace';
import { ConversationalMode } from './ConversationalMode';

interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    plot?: {
        expression: string;
        title: string;
        x_range?: [number, number];
        y_range?: [number, number];
    };
    visualWidget?: {
        type: 'GridMultiplier' | 'ColumnAddition' | 'CalculusTangent' | 'VectorSpace';
        props: any;
    };
}

interface AIContext {
    currentPage: 'study' | 'review' | 'exam' | 'progress';
    question?: {
        id: string;
        content: string;
        topic: string;
        difficulty: number;
        correctAnswer?: string;
    };
    attempts?: {
        count: number;
        lastAnswer?: string;
        timeSpent: number;
    };
    student: {
        masteryLevel: number;
        recentPerformance: 'struggling' | 'learning' | 'proficient';
    };
    uiState?: {
        activeWidget?: string;
        currentInputValue?: string;
        isVisible: boolean;
    };
    recentConcepts?: string[];
}

interface AIPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    context: AIContext;
    position?: 'sidebar' | 'floating' | 'bottom-sheet' | 'fullscreen';
    onSendMessage?: (message: string, context: AIContext, messages: AIMessage[]) => Promise<{ response: string; plot?: any }>;
}

export function AIPanel({
    isOpen,
    onToggle,
    context,
    position = 'sidebar',
    onSendMessage
}: AIPanelProps) {
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isWidgetMinimized, setIsWidgetMinimized] = useState(false);
    const [provider, setProvider] = useState<'anthropic' | 'ollama'>('anthropic');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-expand widget when a new visual representation bounds
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.visualWidget) {
            setIsWidgetMinimized(false);
        }
    }, [messages]);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen && !isMinimized) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, isMinimized]);

    const handleSendMessage = async (textOverride?: string) => {
        const textToSend = textOverride || inputValue;
        if (!textToSend.trim() || isLoading) return;

        const userMessage: AIMessage = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: textToSend.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        if (!textOverride) setInputValue('');
        setIsLoading(true);

        try {
            // Find the active widget from the latest assistant message, if any
            const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
            const activeWidgetType = lastAssistantMsg?.visualWidget?.type;

            // Update context with conversation history and UI state
            const contextWithHistory = {
                ...context,
                conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
                uiState: {
                    activeWidget: activeWidgetType,
                    isVisible: isOpen
                }
            };

            // If custom handler provided, use it
            if (onSendMessage) {
                const result = await onSendMessage(userMessage.content, contextWithHistory, messages);
                const assistantMessage: AIMessage = {
                    id: `msg_${Date.now()}_ai`,
                    role: 'assistant',
                    content: result.response,
                    timestamp: new Date(),
                    plot: result.plot
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                // Call actual AI backend
                const response = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: userMessage.content,
                        context: contextWithHistory,
                        provider: provider
                    })
                });

                if (!response.ok) {
                    throw new Error("Failed to post message to AI.");
                }

                const data = await response.json();

                const assistantMessage: AIMessage = {
                    id: `msg_${Date.now()}_ai`,
                    role: 'assistant',
                    content: data.response,
                    timestamp: new Date(),
                    plot: data.plot,
                    visualWidget: data.visualWidget
                };
                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (error: any) {
            console.error('AI Error:', error);
            const errorMessage: AIMessage = {
                id: `msg_${Date.now()}_error`,
                role: 'assistant',
                content: `Sorry, I encountered an error: ${error?.message || "Please try again."}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleVoiceInput = async (text: string) => {
        setIsSpeaking(true);
        await handleSendMessage(text);
        setTimeout(() => {
            setIsSpeaking(false);
            setTimeout(() => setIsVoiceModeOpen(false), 2000);
        }, 3000);
    };

    // Collapsed state
    if (!isOpen) {
        return (
            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={onToggle}
                className="w-full p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 rounded-2xl border border-violet-200 dark:border-violet-500/20 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-100 dark:bg-violet-500/20 rounded-xl group-hover:scale-110 transition-transform">
                        <Bot className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="text-left flex-1">
                        <h4 className="font-semibold text-sm text-violet-900 dark:text-violet-100">
                            AI Tutor
                        </h4>
                        <p className="text-xs text-violet-600 dark:text-violet-300">
                            Need help? Click to chat
                        </p>
                    </div>
                    <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
            </motion.button>
        );
    }

    // Minimized state (after first use)
    if (isMinimized) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg overflow-hidden"
            >
                <button
                    onClick={() => setIsMinimized(false)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                    <Bot className="w-5 h-5 text-violet-500" />
                    <div className="flex-1 text-left">
                        <span className="text-sm font-medium">AI Tutor</span>
                        {messages.length > 0 && (
                            <p className="text-xs text-zinc-500 truncate">
                                {messages[messages.length - 1].content.slice(0, 30)}...
                            </p>
                        )}
                    </div>
                    <Maximize2 className="w-4 h-4 text-zinc-400" />
                </button>
            </motion.div>
        );
    }

    // Expanded state
    const isFullScreen = position === 'fullscreen';

    const lastVisualMessage = [...messages].reverse().find(m => m.visualWidget);
    const activeWidgetData = lastVisualMessage?.visualWidget;
    const isSplitScreen = isFullScreen && activeWidgetData && !isWidgetMinimized;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={isFullScreen
                ? "flex flex-row relative w-full h-full bg-slate-950 overflow-hidden"
                : "bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col"
            }
            style={isFullScreen ? {} : { height: position === 'sidebar' ? '400px' : '500px' }}
        >
            {/* Split Screen Left Panel */}
            {isSplitScreen && activeWidgetData && (
                <div className="w-1/2 lg:w-[55%] border-r border-white/5 flex flex-col relative h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 flex-shrink-0">
                    <button
                        onClick={() => setIsWidgetMinimized(true)}
                        className="absolute top-6 right-6 z-[100] p-2 bg-slate-800/80 backdrop-blur hover:bg-slate-700 text-slate-300 rounded-xl transition-all hover:scale-105 border border-white/10 flex items-center gap-2 text-sm shadow-2xl"
                    >
                        <Minimize2 className="w-4 h-4 text-cyan-400" /> Minimize Widget
                    </button>
                    <div className="flex-1 w-full h-full flex items-center justify-center p-8 overflow-y-auto overflow-x-hidden relative">
                        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px] pointer-events-none" />
                        <div className="w-full max-w-4xl relative z-10 transform transition-transform duration-500 scale-100 origin-center flex justify-center">
                            {activeWidgetData.type === 'GridMultiplier' && <GridMultiplier {...activeWidgetData.props} />}
                            {activeWidgetData.type === 'ColumnAddition' && <ColumnAddition {...activeWidgetData.props} />}
                            {activeWidgetData.type === 'CalculusTangent' && <CalculusTangent {...activeWidgetData.props} />}
                            {activeWidgetData.type === 'VectorSpace' && <VectorSpace {...activeWidgetData.props} />}
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Container */}
            <div className={`flex flex-col relative h-full ${isSplitScreen ? 'w-1/2 lg:w-[45%] bg-slate-950 shadow-[-20px_0_40px_-5px_rgba(0,0,0,0.3)] z-20 flex-shrink-0' : 'w-full'}`}>

                {/* Header */}
                {!isFullScreen && (
                    <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-500/10 dark:to-purple-500/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bot className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                <span className="font-semibold text-sm text-violet-900 dark:text-violet-100">
                                    AI Tutor
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-medium bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 rounded-full">
                                    {context.question?.topic || 'Ready'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <Minimize2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={onToggle}
                                    className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Context Badge */}
                        {context.question && (
                            <div className="mt-2 p-2 bg-white dark:bg-zinc-800 rounded-lg text-xs">
                                <span className="text-zinc-500">Helping with:</span>{' '}
                                <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                                    {context.question.content.slice(0, 50)}...
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Messages */}
                <div className={isFullScreen ? "flex-1 overflow-y-auto w-full relative pb-40 pt-10 px-4 scroll-smooth" : "flex-1 overflow-y-auto p-4 space-y-4"}>
                    <div className={isFullScreen ? "max-w-4xl mx-auto space-y-12 flex flex-col" : "space-y-4"}>
                        {messages.length === 0 ? (
                            <div className={isFullScreen ? "h-full flex flex-col items-center justify-center text-center p-4 mt-20" : "h-full flex flex-col items-center justify-center text-center p-4"}>
                                <div className="w-16 h-16 bg-violet-100 dark:bg-violet-500/20 rounded-2xl flex items-center justify-center mb-4">
                                    <Bot className="w-8 h-8 text-violet-500" />
                                </div>
                                <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    How can I help?
                                </h4>
                                <p className="text-sm text-zinc-500 max-w-[200px]">
                                    I'm here to guide you through this problem without giving away the answer.
                                </p>

                                {/* Quick prompts */}
                                {!isFullScreen && (
                                    <div className="mt-4 space-y-2 w-full">
                                        {[
                                            "I don't know where to start",
                                            "Can you explain the concept?",
                                            "What formula should I use?"
                                        ].map((prompt, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    setInputValue(prompt);
                                                    inputRef.current?.focus();
                                                }}
                                                className="w-full p-2 text-xs text-left text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {messages.map((message) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={isFullScreen
                                            ? "flex flex-col w-full"
                                            : `flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`
                                        }
                                    >
                                        {isFullScreen ? (
                                            <div className="w-full flex flex-col">
                                                {message.role === 'user' ? (
                                                    <div className="self-end max-w-[85%] bg-zinc-800 border border-zinc-700 text-white px-5 py-3 rounded-3xl rounded-br-sm text-[15px] shadow-sm mb-4">
                                                        {message.content}
                                                    </div>
                                                ) : (
                                                    <div className="self-start w-full flex flex-col">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20 mt-1">
                                                                <Bot className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div className="flex-1 text-slate-200 text-[15px] leading-relaxed pt-1">
                                                                {message.content}
                                                            </div>
                                                        </div>

                                                        {message.visualWidget && (
                                                            <div className="w-full mt-6 mb-2 pl-4 md:pl-12 pr-4 overflow-visible">
                                                                {(!isSplitScreen && message.visualWidget === activeWidgetData) || (!isFullScreen) ? (
                                                                    <div className="w-full flex flex-col">
                                                                        <div className="w-full max-w-5xl flex justify-center overflow-x-auto">
                                                                            {message.visualWidget.type === 'GridMultiplier' && <GridMultiplier {...message.visualWidget.props} />}
                                                                            {message.visualWidget.type === 'ColumnAddition' && <ColumnAddition {...message.visualWidget.props} />}
                                                                            {message.visualWidget.type === 'CalculusTangent' && <CalculusTangent {...message.visualWidget.props} />}
                                                                            {message.visualWidget.type === 'VectorSpace' && <VectorSpace {...message.visualWidget.props} />}
                                                                        </div>
                                                                        {!isSplitScreen && isFullScreen && message.visualWidget === activeWidgetData && (
                                                                            <button onClick={() => setIsWidgetMinimized(false)} className="mt-4 px-4 py-2 text-sm bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 hover:text-violet-300 rounded-xl transition-colors flex items-center gap-2 border border-violet-500/20 w-fit self-center">
                                                                                <LayoutGrid className="w-4 h-4" /> Expand to Split Screen
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-3 p-3 bg-slate-900 border border-violet-500/20 rounded-xl text-slate-300 text-sm shadow-inner max-w-md">
                                                                        <div className="p-2 bg-violet-500/20 rounded-lg"><LayoutGrid className="w-4 h-4 text-violet-400" /></div>
                                                                        <div className="flex-1">Interactive Widget</div>
                                                                        {message.visualWidget === activeWidgetData && (
                                                                            <button onClick={() => setIsWidgetMinimized(false)} className="px-3 py-1.5 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow-md hover:shadow-lg focus:outline-none">
                                                                                <Maximize2 className="w-3 h-3" /> Expand
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div
                                                className={`max-w-[85%] p-3 rounded-2xl text-sm ${message.role === 'user'
                                                    ? 'bg-violet-500 text-white rounded-br-md'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-bl-md'
                                                    }`}
                                            >
                                                {message.content}
                                                {message.plot && (
                                                    <div className="mt-3">
                                                        <AIGraph
                                                            expression={message.plot.expression}
                                                            title={message.plot.title}
                                                            x_range={message.plot.x_range}
                                                            y_range={message.plot.y_range}
                                                        />
                                                    </div>
                                                )}
                                                {message.visualWidget && (
                                                    <div className="mt-3 bg-zinc-950/40 p-4 rounded-xl border border-violet-500/20 shadow-inner overflow-hidden flex flex-col items-center w-full">
                                                        <div className="w-full flex items-center justify-between mb-3 text-xs text-violet-300 font-medium">
                                                            <div className="flex items-center gap-1.5"><LayoutGrid className="w-3.5 h-3.5" /> Interactive Concept</div>
                                                        </div>
                                                        <div className="w-full overflow-hidden flex justify-center origin-top transform scale-75 md:scale-100">
                                                            {message.visualWidget.type === 'GridMultiplier' && (
                                                                <GridMultiplier {...message.visualWidget.props} />
                                                            )}
                                                            {message.visualWidget.type === 'ColumnAddition' && (
                                                                <ColumnAddition {...message.visualWidget.props} />
                                                            )}
                                                            {message.visualWidget.type === 'CalculusTangent' && (
                                                                <CalculusTangent {...message.visualWidget.props} />
                                                            )}
                                                            {message.visualWidget.type === 'VectorSpace' && (
                                                                <VectorSpace {...message.visualWidget.props} />
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-2 text-zinc-500"
                                    >
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Thinking...</span>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>
                </div>

                {/* Input */}
                <div className={isFullScreen
                    ? "absolute bottom-0 left-0 right-0 p-6 pt-16 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent flex flex-col items-center pointer-events-none"
                    : "p-3 border-t border-zinc-200 dark:border-zinc-800"
                }>
                    <div className={isFullScreen
                        ? "w-full max-w-3xl pointer-events-auto bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl p-2 flex flex-col"
                        : "w-full flex flex-col"
                    }>
                        <div className="flex justify-between items-center px-4 pt-1 mb-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">AI Engine</span>
                            <div className="flex bg-slate-900/50 rounded-lg p-1 border border-white/5">
                                <button
                                    onClick={() => setProvider('anthropic')}
                                    className={`px-3 py-1 text-xs rounded-md transition-colors ${provider === 'anthropic' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    Claude 3.5
                                </button>
                                <button
                                    onClick={() => setProvider('ollama')}
                                    className={`px-3 py-1 text-xs rounded-md transition-colors gap-1 flex items-center ${provider === 'ollama' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    Local Ollama
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsVoiceModeOpen(true)}
                                className="p-3 text-zinc-400 hover:text-white rounded-xl transition-colors"
                                title="Voice Mode"
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about this problem..."
                                disabled={isLoading}
                                className="flex-1 px-4 py-3 bg-transparent text-white text-base focus:outline-none disabled:opacity-50"
                            />
                            <button
                                onClick={() => handleSendMessage()}
                                disabled={!inputValue.trim() || isLoading}
                                className="p-3 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 text-white rounded-xl transition-colors disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <ConversationalMode
                    isOpen={isVoiceModeOpen}
                    onClose={() => setIsVoiceModeOpen(false)}
                    onVoiceInput={handleVoiceInput}
                    isSpeaking={isSpeaking}
                />
            </div>
        </motion.div>
    );
}


