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

        // Simulate AI response
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: generateMockResponse(input),
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
            setIsLoading(false);
        }, 1500);
    };

    const generateMockResponse = (question: string): string => {
        if (question.toLowerCase().includes('eigenvalue')) {
            return "Great question! To find eigenvalues of a matrix A, you need to solve the characteristic equation:\n\n$$\\det(A - \\lambda I) = 0$$\n\nHere's the step-by-step process:\n\n1. **Subtract λI from A**: Create the matrix $(A - \\lambda I)$\n2. **Calculate the determinant**: Set $\\det(A - \\lambda I) = 0$\n3. **Solve for λ**: Find the roots of the characteristic polynomial\n\nWould you like me to work through a specific example?";
        }
        if (question.toLowerCase().includes('chain rule')) {
            return "The **Chain Rule** is used when you need to differentiate a composite function.\n\nIf $y = f(g(x))$, then:\n\n$$\\frac{dy}{dx} = f'(g(x)) \\cdot g'(x)$$\n\nThink of it as \"derivative of the outside times derivative of the inside.\"\n\n**Example**: If $y = \\sin(x^2)$\n- Outside function: $\\sin(u)$ with derivative $\\cos(u)$\n- Inside function: $x^2$ with derivative $2x$\n\n$$\\frac{dy}{dx} = \\cos(x^2) \\cdot 2x = 2x\\cos(x^2)$$\n\nWant me to explain more examples?";
        }
        if (question.toLowerCase().includes('integral') || question.toLowerCase().includes('∫')) {
            return "I'd be happy to help with integration! For $\\int x^2 e^x dx$, we use **Integration by Parts** multiple times.\n\nRecall: $\\int u\\,dv = uv - \\int v\\,du$\n\n**Step 1**: Let $u = x^2$ and $dv = e^x dx$\n- Then $du = 2x\\,dx$ and $v = e^x$\n\n$$\\int x^2 e^x dx = x^2 e^x - 2\\int x e^x dx$$\n\n**Step 2**: Apply integration by parts again to $\\int x e^x dx$\n\n**Final Answer**:\n$$\\int x^2 e^x dx = x^2 e^x - 2x e^x + 2e^x + C = e^x(x^2 - 2x + 2) + C$$\n\nWould you like me to explain any step in more detail?";
        }
        return "That's an interesting question! Let me help you understand this concept.\n\nTo give you the best explanation, could you tell me:\n1. Which specific part is confusing?\n2. What course or topic is this from?\n\nI'm here to help you learn step-by-step! 📚";
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
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Background */}
            <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold">AI Math Tutor</h1>
                            <p className="text-xs text-zinc-500">Powered by Qmath AI</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto relative z-10">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <AnimatePresence>
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-4 mb-6 ${message.role === 'user' ? 'justify-end' : ''}`}
                            >
                                {message.role === 'assistant' && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                                    <div className={`p-4 rounded-2xl ${message.role === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-zinc-900 border border-zinc-800'
                                        }`}>
                                        <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                                            {renderContent(message.content)}
                                        </div>
                                    </div>
                                    {message.role === 'assistant' && (
                                        <div className="flex items-center gap-2 mt-2 text-zinc-500">
                                            <button className="p-1 hover:text-white transition-colors">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button className="p-1 hover:text-green-400 transition-colors">
                                                <ThumbsUp className="w-4 h-4" />
                                            </button>
                                            <button className="p-1 hover:text-red-400 transition-colors">
                                                <ThumbsDown className="w-4 h-4" />
                                            </button>
                                            <button className="p-1 hover:text-blue-400 transition-colors">
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {message.role === 'user' && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
                <div className="relative z-10 px-4 pb-4">
                    <div className="max-w-4xl mx-auto">
                        <p className="text-sm text-zinc-500 mb-3 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Try asking:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {suggestedQuestions.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSuggestion(q)}
                                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full text-sm transition-all"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="relative z-10 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask me anything about math, physics, or your courses..."
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-xs text-zinc-600 mt-2 text-center">
                        AI responses are generated. Always verify important calculations.
                    </p>
                </div>
            </div>
        </div>
    );
}
