'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Layers, Library, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import LearningPaths, { LearningPath } from '@/components/features/LearningPaths';
import FlashcardReview, { FlashcardDeck, DeckProgressRing } from '@/components/features/FlashcardReview';
import PersonalLibrary, { LibraryItem } from '@/components/features/PersonalLibrary';
import QuizEngine, { QuizConfig } from '@/components/features/QuizEngine';
import { FreeFormInput, ContentCard } from '@/components/content';
import type { FreeFormProblem } from '@/components/content';

// Demo data
const demoLearningPaths: LearningPath[] = [
    {
        id: 'calc-1',
        title: 'Calculus I',
        description: 'Limits, derivatives, and basic integration',
        icon: '📐',
        color: 'blue',
        totalXP: 1200,
        completedXP: 450,
        nodes: [
            {
                id: 'limits-intro',
                title: 'Introduction to Limits',
                description: 'Understanding the concept of limits and continuity',
                type: 'theory',
                status: 'completed',
                xpReward: 50,
                estimatedMinutes: 15,
                masteryLevel: 92
            },
            {
                id: 'limits-practice',
                title: 'Limit Calculations',
                description: 'Practice evaluating limits algebraically',
                type: 'practice',
                status: 'completed',
                xpReward: 100,
                estimatedMinutes: 30,
                masteryLevel: 85
            },
            {
                id: 'derivatives-intro',
                title: 'Introduction to Derivatives',
                description: 'The derivative as rate of change',
                type: 'theory',
                status: 'in_progress',
                xpReward: 50,
                estimatedMinutes: 20
            },
            {
                id: 'derivatives-rules',
                title: 'Differentiation Rules',
                description: 'Power rule, product rule, chain rule',
                type: 'examples',
                status: 'available',
                xpReward: 75,
                estimatedMinutes: 25
            },
            {
                id: 'integration-basics',
                title: 'Basic Integration',
                description: 'Antiderivatives and indefinite integrals',
                type: 'theory',
                status: 'locked',
                xpReward: 50,
                estimatedMinutes: 20,
                prerequisites: ['derivatives-rules']
            }
        ]
    },
    {
        id: 'linear-algebra',
        title: 'Linear Algebra',
        description: 'Vectors, matrices, and linear transformations',
        icon: '🔢',
        color: 'purple',
        totalXP: 800,
        completedXP: 200,
        nodes: [
            {
                id: 'vectors-intro',
                title: 'Vectors in Rⁿ',
                description: 'Vector operations and geometric interpretation',
                type: 'theory',
                status: 'completed',
                xpReward: 50,
                estimatedMinutes: 15,
                masteryLevel: 88
            },
            {
                id: 'matrices-intro',
                title: 'Matrix Operations',
                description: 'Addition, multiplication, and properties',
                type: 'practice',
                status: 'available',
                xpReward: 100,
                estimatedMinutes: 35
            },
            {
                id: 'determinants',
                title: 'Determinants',
                description: 'Computing and interpreting determinants',
                type: 'examples',
                status: 'locked',
                xpReward: 75,
                estimatedMinutes: 25
            }
        ]
    }
];

const demoFlashcardDeck: FlashcardDeck = {
    id: 'calc-formulas',
    title: 'Calculus Formulas',
    description: 'Essential derivatives and integrals',
    masteryLevel: 72,
    totalCards: 25,
    dueToday: 5,
    cards: [
        {
            id: 'card-1',
            front: 'What is the derivative of sin(x)?',
            back: 'cos(x)',
            frontMath: '\\frac{d}{dx}\\sin(x) = ?',
            backMath: '\\cos(x)',
            difficulty: 2,
            dueDate: new Date(),
            interval: 3,
            easeFactor: 2.5,
            repetitions: 4,
            topicId: 'trig-derivatives',
            topicTitle: 'Trigonometric Derivatives'
        },
        {
            id: 'card-2',
            front: 'What is the integral of 1/x?',
            back: 'ln|x| + C',
            frontMath: '\\int \\frac{1}{x} dx = ?',
            backMath: '\\ln|x| + C',
            difficulty: 2,
            dueDate: new Date(),
            interval: 2,
            easeFactor: 2.3,
            repetitions: 3,
            topicId: 'basic-integrals',
            topicTitle: 'Basic Integrals'
        },
        {
            id: 'card-3',
            front: 'What is the chain rule formula?',
            frontMath: '\\frac{d}{dx}[f(g(x))] = ?',
            back: 'f\'(g(x)) · g\'(x)',
            backMath: "f'(g(x)) \\cdot g'(x)",
            difficulty: 3,
            dueDate: new Date(),
            interval: 1,
            easeFactor: 2.1,
            repetitions: 2,
            topicId: 'chain-rule',
            topicTitle: 'Chain Rule'
        }
    ]
};

const demoLibraryItems: LibraryItem[] = [
    {
        id: 'item-1',
        type: 'problem',
        title: 'Integration by Parts - Challenging Problem',
        description: 'A difficult integration problem using integration by parts twice',
        courseId: 'calc-2',
        courseTitle: 'Calculus II',
        savedAt: new Date('2024-01-15'),
        tags: ['integration', 'challenging'],
        isFavorite: true,
        difficulty: 4
    },
    {
        id: 'item-2',
        type: 'topic',
        title: 'Eigenvalues and Eigenvectors',
        description: 'Complete guide to finding and interpreting eigenvalues',
        courseId: 'linear-algebra',
        courseTitle: 'Linear Algebra',
        savedAt: new Date('2024-01-10'),
        tags: ['eigenvalues', 'matrices'],
        isFavorite: false,
        progressPercent: 65
    },
    {
        id: 'item-3',
        type: 'flashcard_deck',
        title: 'Trig Identities',
        description: '25 essential trigonometric identities',
        courseId: 'calc-1',
        courseTitle: 'Calculus I',
        savedAt: new Date('2024-01-08'),
        tags: ['trigonometry', 'formulas'],
        isFavorite: true
    },
    {
        id: 'item-4',
        type: 'exam',
        title: 'Midterm Exam - Fall 2023',
        description: 'Past exam covering chapters 1-5',
        courseId: 'calc-2',
        courseTitle: 'Calculus II',
        savedAt: new Date('2024-01-05'),
        tags: ['exam', 'practice'],
        isFavorite: false
    }
];

const demoQuizConfig: QuizConfig = {
    title: 'Calculus Quick Quiz',
    description: 'Test your knowledge of basic calculus concepts',
    showTimer: true,
    showProgress: true,
    allowSkip: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    timeLimit: 300,
    questions: [
        {
            id: 'q1',
            content: 'What is the derivative of x²?',
            mathContent: '\\frac{d}{dx}(x^2) = ?',
            options: [
                { id: 'a', content: 'x', mathContent: 'x' },
                { id: 'b', content: '2x', mathContent: '2x' },
                { id: 'c', content: '2', mathContent: '2' },
                { id: 'd', content: 'x²', mathContent: 'x^2' }
            ],
            correctOptionId: 'b',
            explanation: 'Using the power rule, d/dx(xⁿ) = nxⁿ⁻¹, so d/dx(x²) = 2x.',
            difficulty: 1,
            topicId: 'power-rule',
            topicTitle: 'Power Rule'
        },
        {
            id: 'q2',
            content: 'What is the integral of cos(x)?',
            mathContent: '\\int \\cos(x) dx = ?',
            options: [
                { id: 'a', content: '-sin(x) + C', mathContent: '-\\sin(x) + C' },
                { id: 'b', content: 'sin(x) + C', mathContent: '\\sin(x) + C' },
                { id: 'c', content: 'cos(x) + C', mathContent: '\\cos(x) + C' },
                { id: 'd', content: '-cos(x) + C', mathContent: '-\\cos(x) + C' }
            ],
            correctOptionId: 'b',
            explanation: 'The integral of cos(x) is sin(x) + C, since d/dx(sin(x)) = cos(x).',
            difficulty: 2,
            topicId: 'trig-integrals',
            topicTitle: 'Trigonometric Integrals'
        },
        {
            id: 'q3',
            content: 'What is the limit as x approaches 0 of sin(x)/x?',
            mathContent: '\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = ?',
            options: [
                { id: 'a', content: '0' },
                { id: 'b', content: '1' },
                { id: 'c', content: '∞' },
                { id: 'd', content: 'Does not exist' }
            ],
            correctOptionId: 'b',
            explanation: 'This is a famous limit. Using L\'Hôpital\'s rule or the squeeze theorem, we can show that lim(x→0) sin(x)/x = 1.',
            difficulty: 2,
            topicId: 'limits',
            topicTitle: 'Limits'
        }
    ]
};

// Demo AI-generated content
const demoFreeFormProblem: FreeFormProblem = {
    id: 'demo-1',
    problem: 'Simplify the following expression:',
    problemMath: '\\frac{x^2 - 1}{x - 1}',
    expectedAnswer: 'x + 1',
    alternativeForms: ['1 + x', '(x+1)'],
    hints: [
        'Try factoring the numerator',
        'Remember: a² - b² = (a+b)(a-b)',
        'x² - 1 = (x+1)(x-1)'
    ],
    explanation: 'Factor the numerator as a difference of squares: x² - 1 = (x+1)(x-1). Then cancel (x-1) from numerator and denominator, leaving x+1.',
    difficulty: 0.4
};

const demoContentCards = [
    {
        id: 'content-1',
        contentType: 'free_form_symbolic' as const,
        title: 'Simplify Rational Expression',
        preview: 'Factor and simplify (x²-4)/(x-2)',
        difficulty: 0.3,
        estimatedMinutes: 5,
        tags: ['algebra', 'factoring']
    },
    {
        id: 'content-2',
        contentType: 'faded_worked_example' as const,
        title: 'Product Rule Derivative',
        preview: 'Learn to differentiate f(x)·g(x) step by step',
        difficulty: 0.5,
        estimatedMinutes: 10,
        tags: ['calculus', 'derivatives']
    },
    {
        id: 'content-3',
        contentType: 'error_spotting' as const,
        title: 'Find the Integration Error',
        preview: 'Identify the mistake in this integration by parts solution',
        difficulty: 0.7,
        estimatedMinutes: 8,
        tags: ['calculus', 'integration']
    },
    {
        id: 'content-4',
        contentType: 'parsons_problem' as const,
        title: 'Proof: Triangle Inequality',
        preview: 'Arrange the proof steps in correct order',
        difficulty: 0.6,
        estimatedMinutes: 12,
        tags: ['analysis', 'proofs']
    }
];

type DemoTab = 'paths' | 'flashcards' | 'library' | 'quiz' | 'ai-content';

export default function FeaturesDemo() {
    const [activeTab, setActiveTab] = useState<DemoTab>('paths');
    const [libraryItems, setLibraryItems] = useState(demoLibraryItems);

    const tabs = [
        { id: 'paths' as DemoTab, label: 'Learning Paths', icon: BookOpen },
        { id: 'flashcards' as DemoTab, label: 'Flashcards', icon: Layers },
        { id: 'library' as DemoTab, label: 'My Library', icon: Library },
        { id: 'quiz' as DemoTab, label: 'Quiz', icon: Trophy },
        { id: 'ai-content' as DemoTab, label: 'AI Content', icon: Sparkles }
    ];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold mb-4"
                    >
                        Feature Demo
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-white/80 text-lg"
                    >
                        Explore the new learning features powered by modern UI/UX design
                    </motion.p>
                </div>
            </div>

            {/* Tab navigation */}
            <div className="sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex gap-1 py-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {activeTab === 'paths' && (
                    <LearningPaths paths={demoLearningPaths} />
                )}

                {activeTab === 'flashcards' && (
                    <div className="space-y-8">
                        {/* Deck overview */}
                        <div className="flex items-center gap-6 p-6 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                            <DeckProgressRing deck={demoFlashcardDeck} />
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{demoFlashcardDeck.title}</h3>
                                <p className="text-zinc-500">{demoFlashcardDeck.description}</p>
                                <div className="flex gap-4 mt-2 text-sm">
                                    <span className="text-blue-600">{demoFlashcardDeck.dueToday} due today</span>
                                    <span className="text-zinc-400">{demoFlashcardDeck.totalCards} total cards</span>
                                </div>
                            </div>
                        </div>

                        {/* Flashcard review */}
                        <FlashcardReview
                            deck={demoFlashcardDeck}
                            onReview={(cardId, quality) => console.log('Review:', cardId, quality)}
                            onComplete={() => console.log('Session complete!')}
                        />
                    </div>
                )}

                {activeTab === 'library' && (
                    <PersonalLibrary
                        items={libraryItems}
                        onToggleFavorite={(id) => {
                            setLibraryItems(items =>
                                items.map(item =>
                                    item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
                                )
                            );
                        }}
                        onRemove={(id) => {
                            setLibraryItems(items => items.filter(item => item.id !== id));
                        }}
                        onAddTag={(id, tag) => console.log('Add tag:', id, tag)}
                    />
                )}

                {activeTab === 'quiz' && (
                    <QuizEngine
                        config={demoQuizConfig}
                        onComplete={(results, totalTime) => {
                            console.log('Quiz complete:', { results, totalTime });
                        }}
                    />
                )}

                {activeTab === 'ai-content' && (
                    <div className="space-y-8">
                        {/* Section header */}
                        <div className="text-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-4"
                            >
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                    AI-Generated Content
                                </span>
                            </motion.div>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                                Practice with AI-Generated Problems
                            </h2>
                            <p className="text-zinc-500 max-w-lg mx-auto">
                                Automatically generated practice problems based on exam patterns and pedagogical research.
                            </p>
                        </div>

                        {/* Content cards grid */}
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                                Available Problems
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {demoContentCards.map((card) => (
                                    <ContentCard
                                        key={card.id}
                                        {...card}
                                        onStart={() => console.log('Start:', card.id)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Interactive demo */}
                        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                                Try It: Free-Form Input
                            </h3>
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                                <FreeFormInput
                                    problem={demoFreeFormProblem}
                                    showConfidence={true}
                                    onComplete={(result) => {
                                        console.log('Problem completed:', result);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
