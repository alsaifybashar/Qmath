'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Minimize2, Maximize2, Loader2, Sparkles } from 'lucide-react';

interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AIContext {
    currentPage: 'study' | 'review' | 'exam' | 'progress';
    question?: {
        id: string;
        content: string;
        topic: string;
        difficulty: number;
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
}

interface AIPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    context: AIContext;
    position?: 'sidebar' | 'floating' | 'bottom-sheet';
    onSendMessage?: (message: string, context: AIContext) => Promise<string>;
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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen && !isMinimized) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, isMinimized]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: AIMessage = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // If custom handler provided, use it
            if (onSendMessage) {
                const response = await onSendMessage(userMessage.content, context);
                const assistantMessage: AIMessage = {
                    id: `msg_${Date.now()}_ai`,
                    role: 'assistant',
                    content: response,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                // Default mock response
                await new Promise(resolve => setTimeout(resolve, 1000));
                const mockResponse = generateMockResponse(userMessage.content, context);
                const assistantMessage: AIMessage = {
                    id: `msg_${Date.now()}_ai`,
                    role: 'assistant',
                    content: mockResponse,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (error) {
            console.error('AI Error:', error);
            const errorMessage: AIMessage = {
                id: `msg_${Date.now()}_error`,
                role: 'assistant',
                content: "Sorry, I encountered an error. Please try again.",
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
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col"
            style={{ height: position === 'sidebar' ? '400px' : '500px' }}
        >
            {/* Header */}
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
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
                    </div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${message.role === 'user'
                                            ? 'bg-violet-500 text-white rounded-br-md'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-bl-md'
                                        }`}
                                >
                                    {message.content}
                                </div>
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

            {/* Input */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about this problem..."
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        className="p-2 bg-violet-500 hover:bg-violet-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white rounded-xl transition-colors disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// Mock response generator for demo
function generateMockResponse(userMessage: string, context: AIContext): string {
    const message = userMessage.toLowerCase();

    if (message.includes("don't know") || message.includes("start")) {
        return `Let's think about this step by step! 

Looking at the problem, what type of mathematical operation do you think we need to use here? 

Hint: Consider what the question is asking you to find.`;
    }

    if (message.includes("concept") || message.includes("explain")) {
        return `Great question! Let me explain the key concept here.

${context.question?.topic ? `This problem involves ${context.question.topic}.` : ''}

The main idea is to break down the problem into smaller parts. What's the first thing you notice about the given expression?`;
    }

    if (message.includes("formula") || message.includes("rule")) {
        return `Good thinking - formulas are important here!

For this type of problem, you'll want to consider:
• What operation are we performing?
• What rule or formula applies to that operation?

Check the Quick Reference panel on the right for relevant formulas. Which one do you think applies?`;
    }

    if (message.includes("stuck") || message.includes("help")) {
        return `I can help guide you! Let's approach this differently.

Try this: Look at the expression and identify the individual parts. What components do you see?

Once you identify them, we can figure out how to handle each one.`;
    }

    // Default response
    return `That's a good question! 

Let me guide you without giving away the answer:

1. First, identify what the problem is asking
2. Look at the given information
3. Think about what method or approach might work

What do you think the first step should be?`;
}
