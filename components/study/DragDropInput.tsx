'use client';

import { useState, useEffect } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, CheckCircle2 } from 'lucide-react';
import { DragDropQuestion } from '@/types/study';
import { MathRenderer } from './MathRenderer';

interface DragDropProps {
    question: DragDropQuestion;
    onAnswer: (order: string[], isCorrect: boolean) => void;
}

export function DragDropInput({ question, onAnswer }: DragDropProps) {
    // Local state for the list order
    const [items, setItems] = useState(question.items);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Reset when question changes
    useEffect(() => {
        setItems(question.items);
        setIsSubmitted(false);
    }, [question.id]);

    const handleSubmit = () => {
        setIsSubmitted(true);
        const currentOrderIds = items.map(i => i.id);

        // Simple array equality check
        const isCorrect = JSON.stringify(currentOrderIds) === JSON.stringify(question.correctOrder);

        onAnswer(currentOrderIds, isCorrect);
    };

    return (
        <div className="w-full max-w-xl mx-auto flex flex-col h-full items-center justify-center">
            <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mb-8 text-center">
                {question.question.text}
            </h2>

            <Reorder.Group
                axis="y"
                values={items}
                onReorder={!isSubmitted ? setItems : () => { }}
                className="w-full space-y-3"
            >
                {items.map((item) => (
                    <Reorder.Item
                        key={item.id}
                        value={item}
                        className={`
                            relative bg-white dark:bg-zinc-900 border rounded-xl p-4 flex items-center gap-4 select-none
                            ${isSubmitted
                                ? 'border-zinc-200 dark:border-zinc-800'
                                : 'cursor-grab active:cursor-grabbing border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm'
                            }
                        `}
                        whileDrag={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
                    >
                        {!isSubmitted && (
                            <div className="text-zinc-300 dark:text-zinc-600">
                                <GripVertical className="w-6 h-6" />
                            </div>
                        )}
                        <div className="flex-1 font-medium text-lg text-zinc-800 dark:text-zinc-200">
                            <MathRenderer text={item.content} />
                        </div>

                        {isSubmitted && (
                            // Show index or check? Correct order is hard to show simply without index.
                            <div className="text-xs font-mono text-zinc-400">
                                {items.findIndex(i => i.id === item.id) + 1}
                            </div>
                        )}
                    </Reorder.Item>
                ))}
            </Reorder.Group>

            <button
                onClick={handleSubmit}
                disabled={isSubmitted}
                className={`mt-10 px-8 py-3 rounded-full font-bold transition-all shadow-lg w-full md:w-auto
                    ${isSubmitted
                        ? 'bg-zinc-200 text-zinc-500 cursor-default hidden'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 active:scale-95'
                    }
                `}
            >
                Check Order
            </button>

            {isSubmitted && (
                <div className="mt-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4">
                    {JSON.stringify(items.map(i => i.id)) === JSON.stringify(question.correctOrder) ? (
                        <div className="flex items-center gap-2 text-green-500 font-bold bg-green-500/10 px-4 py-2 rounded-full">
                            <CheckCircle2 className="w-5 h-5" /> Correct Order!
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="text-red-500 font-bold mb-2">Incorrect Order</div>
                            {/* Ideally show correct order logic here */}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
