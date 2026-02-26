'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Bot, User, Sparkles, BookOpen, Brain,
    Lightbulb, Copy, ThumbsUp, ThumbsDown, RefreshCw,
    ChevronDown
} from 'lucide-react';
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';

const BlockMath = dynamic(() => import('react-katex').then((mod) => mod.BlockMath), { ssr: false });
const InlineMath = dynamic(() => import('react-katex').then((mod) => mod.InlineMath), { ssr: false });

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const suggestedQuestions = [
    "Explain the chain rule for derivatives",
    "How do I find eigenvalues of a matrix?",
    "What's the difference between σ and π bonds?",
    "Help me solve ∫ x²e^x dx"
];

export default function AIChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hello! I'm your AI Math Tutor. I can help you understand concepts, solve problems step-by-step, and answer questions about calculus, linear algebra, physics, and more.\n\nWhat would you like to learn today?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    context: {
                        currentPage: 'review',
                        student: { masteryLevel: 0.5, recentPerformance: 'learning' },
                        conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
                    }
                })
            });

            if (!response.ok) {
                let errStr = "Failed to communicate with AI Tutor";
                try {
                    const errObj = await response.json();
                    errStr = errObj.details || errObj.error || errStr;
                } catch (e) { }
                throw new Error(errStr);
            }

            const data = await response.json();

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
        } catch (error: any) {
            console.error('Chat error:', error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Sorry, I encountered an error: ${error?.message || "Please try again."}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestion = (question: string) => {
        setInput(question);
    };

    const renderContent = (content: string) => {
        // Split content by $$ for block math and $ for inline math
        const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[^$]+\$)/g);

        return parts.map((part, i) => {
            if (part.startsWith('$$') && part.endsWith('$$')) {
                const math = part.slice(2, -2);
                return (
                    <div key={i} className="my-4 flex justify-center">
                        <BlockMath math={math} />
                    </div>
                );
            } else if (part.startsWith('$') && part.endsWith('$')) {
                const math = part.slice(1, -1);
                return <InlineMath key={i} math={math} />;
            } else {
                // Handle bold text and line breaks
                return part.split('\n').map((line, j) => (
                    <span key={`${i}-${j}`}>
                        {line.split(/(\*\*.*?\*\*)/g).map((segment, k) => {
                            if (segment.startsWith('**') && segment.endsWith('**')) {
                                return <strong key={k}>{segment.slice(2, -2)}</strong>;
                            }
                            return segment;
                        })}
                        {j < part.split('\n').length - 1 && <br />}
                    </span>
                ));
            }
        });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-6 flex-shrink-0"
            >
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/20">
                    <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-lg">AI Math Tutor</h1>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Powered by Qmath AI</p>
                </div>
            </motion.div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto min-h-0 pb-4 pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex gap-4 mb-6 ${message.role === 'user' ? 'justify-end' : ''}`}
                        >
                            {message.role === 'assistant' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <div className={`max-w-[85%] ${message.role === 'user' ? 'order-first' : ''}`}>
                                <div className={`p-4 rounded-2xl shadow-sm ${message.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
                                    }`}>
                                    <div className={`prose prose-sm max-w-none leading-relaxed ${message.role === 'user' ? 'prose-invert' : 'dark:prose-invert prose-zinc'}`}>
                                        {renderContent(message.content)}
                                    </div>
                                </div>
                                {message.role === 'assistant' && (
                                    <div className="flex items-center gap-2 mt-2 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                            <Copy className="w-3 h-3" />
                                        </button>
                                        <button className="p-1 hover:text-green-500 transition-colors">
                                            <ThumbsUp className="w-3 h-3" />
                                        </button>
                                        <button className="p-1 hover:text-red-500 transition-colors">
                                            <ThumbsDown className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {message.role === 'user' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-4 mb-6"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
                <div className="mb-4">
                    <p className="text-xs text-zinc-500 mb-3 flex items-center gap-2 font-medium">
                        <Lightbulb className="w-3 h-3" />
                        Try asking:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {suggestedQuestions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => handleSuggestion(q)}
                                className="px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-full text-xs transition-all shadow-sm hover:shadow-md"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="relative z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask anything..."
                        className="flex-1 px-4 py-3 bg-transparent border-none focus:ring-0 outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <p className="text-[10px] text-zinc-400 text-center mt-2">
                AI responses are generated. Verify important calculations.
            </p>
        </div>
    );
}
