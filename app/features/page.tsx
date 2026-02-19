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
        title: 'Envariabelanalys 1',
        description: 'Gränsvärden, derivator och grundläggande integration',
        icon: '📐',
        color: 'blue',
        totalXP: 1200,
        completedXP: 450,
        nodes: [
            {
                id: 'limits-intro',
                title: 'Introduktion till gränsvärden',
                description: 'Förståelse för gränsvärden och kontinuitet',
                type: 'theory',
                status: 'completed',
                xpReward: 50,
                estimatedMinutes: 15,
                masteryLevel: 92
            },
            {
                id: 'limits-practice',
                title: 'Gränsvärdesberäkningar',
                description: 'Öva på att beräkna gränsvärden algebraiskt',
                type: 'practice',
                status: 'completed',
                xpReward: 100,
                estimatedMinutes: 30,
                masteryLevel: 85
            },
            {
                id: 'derivatives-intro',
                title: 'Introduktion till derivator',
                description: 'Derivatan som förändringshastighet',
                type: 'theory',
                status: 'in_progress',
                xpReward: 50,
                estimatedMinutes: 20
            },
            {
                id: 'derivatives-rules',
                title: 'Deriveringsregler',
                description: 'Potensregeln, produktregeln, kedjeregeln',
                type: 'examples',
                status: 'available',
                xpReward: 75,
                estimatedMinutes: 25
            },
            {
                id: 'integration-basics',
                title: 'Grundläggande integration',
                description: 'Primitiva funktioner och obestämda integraler',
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
        title: 'Linjär algebra',
        description: 'Vektorer, matriser och linjära transformationer',
        icon: '🔢',
        color: 'purple',
        totalXP: 800,
        completedXP: 200,
        nodes: [
            {
                id: 'vectors-intro',
                title: 'Vektorer i Rⁿ',
                description: 'Vektoroperationer och geometrisk tolkning',
                type: 'theory',
                status: 'completed',
                xpReward: 50,
                estimatedMinutes: 15,
                masteryLevel: 88
            },
            {
                id: 'matrices-intro',
                title: 'Matrisoperationer',
                description: 'Addition, multiplikation och egenskaper',
                type: 'practice',
                status: 'available',
                xpReward: 100,
                estimatedMinutes: 35
            },
            {
                id: 'determinants',
                title: 'Determinanter',
                description: 'Beräkning och tolkning av determinanter',
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
    title: 'Formler för analys',
    description: 'Viktiga derivator och integraler',
    masteryLevel: 72,
    totalCards: 25,
    dueToday: 5,
    cards: [
        {
            id: 'card-1',
            front: 'Vad är derivatan av sin(x)?',
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
            front: 'Vad är integralen av 1/x?',
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
            front: 'Vad är formeln för kedjeregeln?',
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
        title: 'Partiell integration - Utmanande problem',
        description: 'Ett svårt integrationsproblem som använder partiell integration två gånger',
        courseId: 'calc-2',
        courseTitle: 'Envariabelanalys 2',
        savedAt: new Date('2024-01-15'),
        tags: ['integration', 'challenging'],
        isFavorite: true,
        difficulty: 4
    },
    {
        id: 'item-2',
        type: 'topic',
        title: 'Egenvärden och egenvektorer',
        description: 'Komplett guide till att hitta och tolka egenvärden',
        courseId: 'linear-algebra',
        courseTitle: 'Linjär algebra',
        savedAt: new Date('2024-01-10'),
        tags: ['eigenvalues', 'matrices'],
        isFavorite: false,
        progressPercent: 65
    },
    {
        id: 'item-3',
        type: 'flashcard_deck',
        title: 'Trigonometriska identiteter',
        description: '25 viktiga trigonometriska identiteter',
        courseId: 'calc-1',
        courseTitle: 'Envariabelanalys 1',
        savedAt: new Date('2024-01-08'),
        tags: ['trigonometry', 'formulas'],
        isFavorite: true
    },
    {
        id: 'item-4',
        type: 'exam',
        title: 'Dugga - Höst 2023',
        description: 'Tidigare tenta som täcker kapitel 1-5',
        courseId: 'calc-2',
        courseTitle: 'Envariabelanalys 2',
        savedAt: new Date('2024-01-05'),
        tags: ['exam', 'practice'],
        isFavorite: false
    }
];

const demoQuizConfig: QuizConfig = {
    title: 'Snabbquiz i analys',
    description: 'Testa dina kunskaper i grundläggande analyskoncept',
    showTimer: true,
    showProgress: true,
    allowSkip: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    timeLimit: 300,
    questions: [
        {
            id: 'q1',
            content: 'Vad är derivatan av x²?',
            mathContent: '\\frac{d}{dx}(x^2) = ?',
            options: [
                { id: 'a', content: 'x', mathContent: 'x' },
                { id: 'b', content: '2x', mathContent: '2x' },
                { id: 'c', content: '2', mathContent: '2' },
                { id: 'd', content: 'x²', mathContent: 'x^2' }
            ],
            correctOptionId: 'b',
            explanation: 'Med potensregeln, d/dx(xⁿ) = nxⁿ⁻¹, alltså d/dx(x²) = 2x.',
            difficulty: 1,
            topicId: 'power-rule',
            topicTitle: 'Power Rule'
        },
        {
            id: 'q2',
            content: 'Vad är integralen av cos(x)?',
            mathContent: '\\int \\cos(x) dx = ?',
            options: [
                { id: 'a', content: '-sin(x) + C', mathContent: '-\\sin(x) + C' },
                { id: 'b', content: 'sin(x) + C', mathContent: '\\sin(x) + C' },
                { id: 'c', content: 'cos(x) + C', mathContent: '\\cos(x) + C' },
                { id: 'd', content: '-cos(x) + C', mathContent: '-\\cos(x) + C' }
            ],
            correctOptionId: 'b',
            explanation: 'Integralen av cos(x) är sin(x) + C, eftersom d/dx(sin(x)) = cos(x).',
            difficulty: 2,
            topicId: 'trig-integrals',
            topicTitle: 'Trigonometric Integrals'
        },
        {
            id: 'q3',
            content: 'Vad är gränsvärdet när x går mot 0 för sin(x)/x?',
            mathContent: '\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = ?',
            options: [
                { id: 'a', content: '0' },
                { id: 'b', content: '1' },
                { id: 'c', content: '∞' },
                { id: 'd', content: 'Existerar ej' }
            ],
            correctOptionId: 'b',
            explanation: 'Detta är ett känt gränsvärde. Med L\'Hôpitals regel eller instängningssatsen kan vi visa att lim(x→0) sin(x)/x = 1.',
            difficulty: 2,
            topicId: 'limits',
            topicTitle: 'Limits'
        }
    ]
};

// Demo AI-generated content
const demoFreeFormProblem: FreeFormProblem = {
    id: 'demo-1',
    problem: 'Förenkla följande uttryck:',
    problemMath: '\\frac{x^2 - 1}{x - 1}',
    expectedAnswer: 'x + 1',
    alternativeForms: ['1 + x', '(x+1)'],
    hints: [
        'Försök faktorisera täljaren',
        'Kom ihåg: a² - b² = (a+b)(a-b)',
        'x² - 1 = (x+1)(x-1)'
    ],
    explanation: 'Faktorisera täljaren som en differens av kvadrater: x² - 1 = (x+1)(x-1). Förkorta sedan med (x-1) i täljare och nämnare, kvar blir x+1.',
    difficulty: 0.4
};

const demoContentCards = [
    {
        id: 'content-1',
        contentType: 'free_form_symbolic' as const,
        title: 'Förenkla rationellt uttryck',
        preview: 'Faktorisera och förenkla (x²-4)/(x-2)',
        difficulty: 0.3,
        estimatedMinutes: 5,
        tags: ['algebra', 'factoring']
    },
    {
        id: 'content-2',
        contentType: 'faded_worked_example' as const,
        title: 'Derivata med produktregeln',
        preview: 'Lär dig derivera f(x)·g(x) steg för steg',
        difficulty: 0.5,
        estimatedMinutes: 10,
        tags: ['calculus', 'derivatives']
    },
    {
        id: 'content-3',
        contentType: 'error_spotting' as const,
        title: 'Hitta integrationsfelet',
        preview: 'Identifiera misstaget i denna lösning med partiell integration',
        difficulty: 0.7,
        estimatedMinutes: 8,
        tags: ['calculus', 'integration']
    },
    {
        id: 'content-4',
        contentType: 'parsons_problem' as const,
        title: 'Bevis: Triangelolikheten',
        preview: 'Ordna bevisstegen i rätt ordning',
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
        { id: 'paths' as DemoTab, label: 'Lärvägar', icon: BookOpen },
        { id: 'flashcards' as DemoTab, label: 'Flashcards', icon: Layers },
        { id: 'library' as DemoTab, label: 'Mitt bibliotek', icon: Library },
        { id: 'quiz' as DemoTab, label: 'Quiz', icon: Trophy },
        { id: 'ai-content' as DemoTab, label: 'AI-innehåll', icon: Sparkles }
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
                        Funktionsdemo
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-white/80 text-lg"
                    >
                        Utforska de nya inlärningsfunktionerna drivna av modern UI/UX-design
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
                                    <span className="text-blue-600">{demoFlashcardDeck.dueToday} att göra idag</span>
                                    <span className="text-zinc-400">{demoFlashcardDeck.totalCards} totalt antal kort</span>
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
                                    AI-genererat innehåll
                                </span>
                            </motion.div>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                                Öva med AI-genererade problem
                            </h2>
                            <p className="text-zinc-500 max-w-lg mx-auto">
                                Automatiskt genererade övningsproblem baserade på tentamensmönster och pedagogisk forskning.
                            </p>
                        </div>

                        {/* Content cards grid */}
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                                Tillgängliga problem
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
                                Prova: Fritextinmatning
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
