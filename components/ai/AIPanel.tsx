'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Minimize2, Maximize2, Loader2, Sparkles, LayoutGrid, Mic } from 'lucide-react';
import { AIGraph } from './AIGraph';
import { GridMultiplier } from '../interactive/GridMultiplier';
import { ColumnAddition } from '../interactive/ColumnAddition';
import { CalculusTangent } from '../interactive/CalculusTangent';
import { VectorSpace } from '../interactive/VectorSpace';
import { ConversationalMode } from './ConversationalMode';
import { PolynomialRootFinder } from '../interactive/templates/PolynomialRootFinder';
import { InteractiveUnitCircle } from '../interactive/templates/InteractiveUnitCircle';
import { InequalitiesVisualizer } from '../interactive/templates/InequalitiesVisualizer';
import { VectorOperationsBoard } from '../interactive/templates/VectorOperationsBoard';
import { MatrixDeformationBoard } from '../interactive/templates/MatrixDeformationBoard';
import { LinearSpanExplorer } from '../interactive/templates/LinearSpanExplorer';
import { EigenvectorVisualizer } from '../interactive/templates/EigenvectorVisualizer';
import { IntersectingPlanes3D } from '../interactive/templates/IntersectingPlanes3D';
import { DerivativeDefinitionBoard } from '../interactive/templates/DerivativeDefinitionBoard';
import { CurveSketchingBoard } from '../interactive/templates/CurveSketchingBoard';
import { RiemannSumsVisualizer } from '../interactive/templates/RiemannSumsVisualizer';
import { TaylorSeriesApproximation } from '../interactive/templates/TaylorSeriesApproximation';
import { useBoardNarration } from '@/lib/hooks/useBoardNarration';
import type { AnyWidgetType, BoardStateSnapshot } from '@/types/jsxgraph-widgets';
import { MarkdownMessage } from '@/components/ui/MarkdownMessage';
import { JSXTemplate } from '../interactive/JSXTemplate';

interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isNarration?: boolean;
    plot?: {
        expression: string;
        title: string;
        x_range?: [number, number];
        y_range?: [number, number];
    };
    visualWidget?: {
        type: AnyWidgetType;
        props: any;
    };
}

interface AIContext {
    currentPage: 'study' | 'review' | 'exam' | 'progress';
    /** 'explore' = free learning assistant; 'guided' = Socratic tutoring on a specific question */
    mode?: 'explore' | 'guided';
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
    position?: 'sidebar' | 'floating' | 'bottom-sheet' | 'fullscreen' | 'panel';
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
    /**
     * ID of the message whose widget is currently "active" in the split-screen
     * panel. Null before any widget has arrived; updated automatically when a
     * new widget arrives, and manually when the user clicks Expand on any old
     * widget in the chat history.
     */
    const [activeWidgetMessageId, setActiveWidgetMessageId] = useState<string | null>(null);
    const [provider, setProvider] = useState<'anthropic' | 'ollama'>('anthropic');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { reportBoardState, lastNarration } = useBoardNarration({
        debounceMs: 1500,
        provider,
        onNarration: (text) => {
            setMessages(prev => [...prev, {
                id: `narration_${Date.now()}`,
                role: 'assistant',
                content: text,
                timestamp: new Date(),
                isNarration: true,
            }]);
        },
    });

    const renderJSXWidget = useCallback((widgetData: { type: string; props: any }, withStateChange = true) => {
        const stateChangeHandler = withStateChange
            ? (state: Record<string, any>) => {
                const lastWidgetMsg = [...messages].reverse().find(m => m.visualWidget);
                const widgetType = lastWidgetMsg?.visualWidget?.type || widgetData.type;
                reportBoardState({
                    widgetType: widgetType as AnyWidgetType,
                    timestamp: Date.now(),
                    data: state as BoardStateSnapshot['data'],
                });
            }
            : undefined;

        const sharedProps = { ...widgetData.props, onStateChange: stateChangeHandler };

        switch (widgetData.type) {
            case 'PolynomialRootFinder':    return <PolynomialRootFinder {...sharedProps} />;
            case 'InteractiveUnitCircle':   return <InteractiveUnitCircle {...sharedProps} />;
            case 'InequalitiesVisualizer':  return <InequalitiesVisualizer {...sharedProps} />;
            case 'VectorOperationsBoard':   return <VectorOperationsBoard {...sharedProps} />;
            case 'MatrixDeformationBoard':  return <MatrixDeformationBoard {...sharedProps} />;
            case 'LinearSpanExplorer':      return <LinearSpanExplorer {...sharedProps} />;
            case 'EigenvectorVisualizer':   return <EigenvectorVisualizer {...sharedProps} />;
            case 'IntersectingPlanes3D':    return <IntersectingPlanes3D {...sharedProps} />;
            case 'DerivativeDefinitionBoard': return <DerivativeDefinitionBoard {...sharedProps} />;
            case 'CurveSketchingBoard':     return <CurveSketchingBoard {...sharedProps} />;
            case 'RiemannSumsVisualizer':   return <RiemannSumsVisualizer {...sharedProps} />;
            case 'TaylorSeriesApproximation': return <TaylorSeriesApproximation {...sharedProps} />;
            case 'GridMultiplier':  return <GridMultiplier {...widgetData.props} />;
            case 'ColumnAddition':  return <ColumnAddition {...widgetData.props} />;
            case 'CalculusTangent': return <CalculusTangent {...widgetData.props} />;
            case 'VectorSpace':     return <VectorSpace {...widgetData.props} />;
            default:
                // Route all new template IDs (kebab-case) to the generic JSXTemplate renderer
                return (
                    <JSXTemplate
                        templateId={widgetData.type}
                        config={widgetData.props ?? {}}
                        onStateChange={stateChangeHandler}
                    />
                );
        }
    }, [messages, reportBoardState]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // When a new widget arrives: make it the active one and auto-expand split-screen.
    // This also handles the "new figure should override the expanded one" requirement.
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.visualWidget) {
            setActiveWidgetMessageId(lastMsg.id);
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

    // Auto-greeting for 'panel' (question-view guided mode): AI opens the conversation
    const hasGreetedRef = useRef(false);
    useEffect(() => {
        if (position !== 'panel') return;
        if (hasGreetedRef.current) return;
        if (!isOpen || !context.question) return;
        hasGreetedRef.current = true;

        (async () => {
            setIsLoading(true);
            try {
                const resp = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: '__OPEN__',
                        context: { ...context, conversationHistory: [] },
                        provider,
                    }),
                });
                const data = await resp.json();
                if (data.response) {
                    setMessages([{
                        id: `greeting_${Date.now()}`,
                        role: 'assistant',
                        content: data.response,
                        timestamp: new Date(),
                        plot: data.plot || undefined,
                        visualWidget: data.visualWidget || undefined,
                    }]);
                }
            } catch {
                // silent — student can still type
            } finally {
                setIsLoading(false);
                setTimeout(() => inputRef.current?.focus(), 150);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, position, context.question?.id]);

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
                    // Surface the server's human-readable details when available
                    // (e.g. Ollama timeout message), otherwise use a generic fallback.
                    let detail = 'Failed to get a response. Please try again.';
                    try {
                        const errBody = await response.json();
                        if (errBody?.details) detail = errBody.details;
                        else if (errBody?.error) detail = errBody.error;
                    } catch { /* ignore parse errors */ }
                    throw new Error(detail);
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

    // ── PANEL MODE (right-side split in question view) ──────────────────────────
    if (position === 'panel') {
        const QUICK_REPLIES = ['Jag förstår inte', 'Kan du förklara mer?', 'Vad är nästa steg?', 'Ge mig en ledtråd'];
        return (
            <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
                {/* Header */}
                <div className="flex-none px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 bg-white dark:bg-zinc-900/80">
                    <div className="w-8 h-8 bg-violet-100 dark:bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-zinc-900 dark:text-white leading-none">AI-handledare</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            {context.question?.topic || 'Vägledning'}
                        </p>
                    </div>
                    {/* Provider toggle */}
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 gap-0.5 flex-shrink-0">
                        <button
                            onClick={() => setProvider('anthropic')}
                            className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${provider === 'anthropic' ? 'bg-violet-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                        >Claude</button>
                        <button
                            onClick={() => setProvider('ollama')}
                            className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${provider === 'ollama' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                        >Lokal</button>
                    </div>
                    <button
                        onClick={onToggle}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
                        title="Stäng handledaren"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Messages — scrollable */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
                    {/* Loading greeting */}
                    {messages.length === 0 && isLoading && (
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-violet-100 dark:bg-violet-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Handledaren analyserar uppgiften...
                            </div>
                        </div>
                    )}
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {message.role === 'assistant' && (
                                <div className="w-7 h-7 bg-violet-100 dark:bg-violet-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <Bot className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                </div>
                            )}
                            <div className={`max-w-[82%] text-sm leading-relaxed ${
                                message.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl rounded-bl-sm px-4 py-2.5'
                            }`}>
                                {message.role === 'assistant'
                                    ? <MarkdownMessage content={message.content} className="text-sm" />
                                    : <p className="whitespace-pre-wrap">{message.content}</p>
                                }
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
                                    <div className="mt-3 -mx-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 overflow-hidden">
                                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1.5">
                                            <LayoutGrid className="w-3 h-3" /> Interaktiv visualisering
                                        </div>
                                        <div className="overflow-x-auto flex justify-center transform scale-[0.85] origin-top">
                                            {renderJSXWidget(message.visualWidget, false)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && messages.length > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-violet-100 dark:bg-violet-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Tänker...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick replies — shown when AI has responded */}
                {messages.length > 0 && !isLoading && (
                    <div className="flex-none px-4 pb-2 flex flex-wrap gap-1.5">
                        {QUICK_REPLIES.map((reply) => (
                            <button
                                key={reply}
                                onClick={() => { setInputValue(reply); setTimeout(() => inputRef.current?.focus(), 0); }}
                                className="px-3 py-1 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-700 dark:hover:text-violet-300 rounded-full transition-colors border border-transparent hover:border-violet-200 dark:hover:border-violet-500/30"
                            >
                                {reply}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className="flex-none px-4 pb-4 pt-2 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    <div className="flex gap-2 items-center">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Skriv ditt svar eller fråga..."
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 text-sm rounded-xl border-2 border-transparent focus:border-violet-400 dark:focus:border-violet-500 focus:outline-none disabled:opacity-50 transition-colors"
                        />
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!inputValue.trim() || isLoading}
                            className="p-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-200 dark:disabled:bg-zinc-700 text-white disabled:text-zinc-400 rounded-xl transition-colors disabled:cursor-not-allowed flex-shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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

    // Mode helpers
    const isExploreMode = context.mode === 'explore' || !context.question?.correctAnswer;

    // Expanded state
    const isFullScreen = position === 'fullscreen';

    // Prefer the explicitly-selected message; fall back to the latest widget message
    // so the panel shows something even before the user has interacted.
    const activeWidgetMessage = activeWidgetMessageId
        ? messages.find(m => m.id === activeWidgetMessageId)
        : [...messages].reverse().find(m => m.visualWidget);
    const activeWidgetData = activeWidgetMessage?.visualWidget;
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
            {/* ── VISUALIZATION PANEL (left, 62%) ─────────────────────────────
                Widget fills the panel at maximum size from the start.
                NO panel-level scroll — JSXGraph handles native zoom/pan
                via scroll wheel and drag inside the board itself.
            ─────────────────────────────────────────────────────────────── */}
            {isSplitScreen && activeWidgetData && (
                <div
                    className="border-r border-white/5 flex flex-col h-full flex-shrink-0 relative"
                    style={{ width: '62%', background: 'radial-gradient(ellipse at 50% 60%, #0f1729 0%, #020617 100%)' }}
                >
                    {/* Thin top bar: widget name (left) + hint + minimize (right) */}
                    <div className="flex-none flex items-center justify-between px-5 py-2.5 border-b border-white/[0.06] bg-slate-950/50">
                        <div className="flex items-center gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-500/80" />
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                                {activeWidgetData.type.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-600 select-none">
                                Scroll inside to zoom · drag to pan
                            </span>
                            <button
                                onClick={() => setIsWidgetMinimized(true)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
                            >
                                <Minimize2 className="w-3 h-3" />
                                Minimize
                            </button>
                        </div>
                    </div>

                    {/* ── Widget area: fills remaining space, NO overflow/scroll ────
                        CSS min() constrains the board to the smaller of panel width
                        or panel height, so it always fits without clipping.
                    ──────────────────────────────────────────────────────────── */}
                    <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center relative">
                        {/* Subtle grid background */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
                        {/*
                            Size the board to the largest square that fits the panel.
                            - 62vw  = panel width  (matches the 62% above)
                            - 100vh - 64px header - 44px top bar - 24px padding = ~100vh - 8.5rem
                            The widget itself uses w-full, so it fills this wrapper.
                        */}
                        {/* key forces a full unmount+remount when the active widget
                            changes, so JSXGraph always reinitialises cleanly. */}
                        <div
                            key={activeWidgetMessageId ?? 'widget'}
                            className="relative z-10"
                            style={{
                                width: 'min(calc(62vw - 2rem), calc(100vh - 8.5rem))',
                                aspectRatio: '1 / 1',
                            }}
                        >
                            {renderJSXWidget(activeWidgetData, true)}
                        </div>

                        {/* AI narration overlay — bottom of the viz area */}
                        {lastNarration && (
                            <div className="absolute bottom-4 left-4 right-4 z-50 px-4 py-2.5 bg-slate-950/90 backdrop-blur-md border border-violet-500/25 rounded-xl text-[12px] text-slate-300 italic pointer-events-none flex items-start gap-2 shadow-xl">
                                <Bot className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
                                <span>{lastNarration}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── CHAT PANEL ──────────────────────────────────────────────────
                h-full + flex flex-col + min-h-0 gives the messages div a
                defined height so overflow-y-auto triggers properly.
            ─────────────────────────────────────────────────────────────── */}
            <div
                className={`flex flex-col relative h-full min-h-0 ${
                    isSplitScreen
                        ? 'bg-slate-950 border-l border-white/[0.04] z-20 flex-shrink-0'
                        : 'w-full'
                }`}
                style={isSplitScreen ? { width: '38%' } : undefined}
            >

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

                {/* Messages — min-h-0 ensures flex-1 respects overflow-y-auto in flex columns */}
                <div className={isFullScreen ? "flex-1 min-h-0 overflow-y-auto w-full relative pb-40 pt-10 px-4 scroll-smooth" : "flex-1 min-h-0 overflow-y-auto p-4 space-y-4"}>
                    <div className={isFullScreen ? "max-w-4xl mx-auto space-y-12 flex flex-col" : "space-y-4"}>
                        {messages.length === 0 ? (
                            <div className={isFullScreen ? "h-full flex flex-col items-center justify-center text-center p-4 mt-20" : "h-full flex flex-col items-center justify-center text-center p-4"}>
                                <div className="w-16 h-16 bg-violet-100 dark:bg-violet-500/20 rounded-2xl flex items-center justify-center mb-4">
                                    <Bot className="w-8 h-8 text-violet-500" />
                                </div>
                                <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    {isExploreMode ? 'Explore Mathematics' : 'How can I help?'}
                                </h4>
                                <p className="text-sm text-zinc-500 max-w-[220px]">
                                    {isExploreMode
                                        ? 'Ask me anything — concepts, visualizations, proofs, or how topics connect.'
                                        : "I'm here to guide you through this problem without giving away the answer."}
                                </p>

                                {/* Quick prompts */}
                                {isExploreMode && isFullScreen && (
                                    <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-lg">
                                        {[
                                            'Explain derivatives visually',
                                            'Show me how eigenvectors work',
                                            'What is the intuition behind integrals?',
                                            'How do Taylor series approximate functions?',
                                        ].map((prompt, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    setInputValue(prompt);
                                                    inputRef.current?.focus();
                                                }}
                                                className="px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-violet-500/50 rounded-full transition-all"
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {!isExploreMode && !isFullScreen && (
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
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${message.isNarration ? 'bg-violet-500/30 shadow-none' : 'bg-violet-600 shadow-lg shadow-violet-500/20'}`}>
                                                                <Bot className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div className={`flex-1 leading-relaxed pt-1 ${message.isNarration ? 'text-slate-400 text-sm italic border-l-2 border-violet-500/30 pl-3' : 'text-slate-200 text-[15px]'}`}>
                                                                {message.isNarration
                                                                    ? message.content
                                                                    : <MarkdownMessage content={message.content} className="text-[15px]" />
                                                                }
                                                            </div>
                                                        </div>

                                                        {message.visualWidget && (
                                                            <div className="w-full mt-6 mb-2 pl-4 md:pl-12 pr-4 overflow-visible">
                                                                {/* isActiveWidget: this message is the currently-selected one */}
                                                                {(() => {
                                                                    const isActiveWidget = message.id === activeWidgetMessageId;
                                                                    // Show inline board when this is the active widget AND it's minimized (not in split-screen),
                                                                    // or when we're not in fullscreen mode.
                                                                    const showInlineBoard = (!isSplitScreen && isActiveWidget) || !isFullScreen;
                                                                    if (showInlineBoard) {
                                                                        return (
                                                                            <div className="w-full flex flex-col">
                                                                                {/* Max-width capped so aspect-square height fits in the viewport */}
                                                                                <div className="w-full flex justify-center overflow-x-auto">
                                                                                    <div style={{ width: '100%', maxWidth: '520px' }}>
                                                                                        {renderJSXWidget(message.visualWidget, isActiveWidget)}
                                                                                    </div>
                                                                                </div>
                                                                                {!isSplitScreen && isFullScreen && isActiveWidget && (
                                                                                    <button onClick={() => setIsWidgetMinimized(false)} className="mt-4 px-4 py-2 text-sm bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 hover:text-violet-300 rounded-xl transition-colors flex items-center gap-2 border border-violet-500/20 w-fit self-center">
                                                                                        <LayoutGrid className="w-4 h-4" /> Expand to Split Screen
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    }
                                                                    // Badge shown when split-screen is active OR this is a historical (non-active) widget.
                                                                    // All badges now have an Expand button so any historical figure can be re-opened.
                                                                    const isCurrentlyExpanded = isActiveWidget && isSplitScreen;
                                                                    return (
                                                                    <div className="flex items-center gap-3 p-3 bg-slate-900 border border-violet-500/20 rounded-xl text-slate-300 text-sm shadow-inner max-w-md">
                                                                        <div className="p-2 bg-violet-500/20 rounded-lg"><LayoutGrid className="w-4 h-4 text-violet-400" /></div>
                                                                        <div className="flex-1 truncate">
                                                                            Interactive Widget: <span className="font-mono text-violet-300 text-xs">{message.visualWidget.type}</span>
                                                                        </div>
                                                                        {isCurrentlyExpanded ? (
                                                                            // Already in split-screen — offer to minimize
                                                                            <button onClick={() => setIsWidgetMinimized(true)} className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors flex items-center gap-1 focus:outline-none">
                                                                                <Minimize2 className="w-3 h-3" /> Minimize
                                                                            </button>
                                                                        ) : (
                                                                            // Not expanded — clicking Expand switches to this widget
                                                                            <button onClick={() => { setActiveWidgetMessageId(message.id); setIsWidgetMinimized(false); }} className="px-3 py-1.5 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow-md hover:shadow-lg focus:outline-none">
                                                                                <Maximize2 className="w-3 h-3" /> Expand
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                );
                                                                })()}
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
                                                            {renderJSXWidget(message.visualWidget, false)}
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
                                placeholder={isExploreMode ? "Ask anything — concepts, proofs, visualizations..." : "Ask about this problem..."}
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


