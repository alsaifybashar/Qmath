/**
 * Content Generation Type Definitions
 */

import type { ContentType, FreeFormSymbolicContent, FadedWorkedExampleContent, ParsonsContent, ErrorSpottingContent } from '@/db/content-schema';

// Re-export database types
export type { ContentType, FreeFormSymbolicContent, FadedWorkedExampleContent, ParsonsContent, ErrorSpottingContent };

/**
 * Generation request options
 */
export interface GenerationRequest {
    topicId: string;
    contentType: ContentType;
    difficulty?: number; // 0-1, optional target difficulty
    sourceExamQuestionIds?: string[]; // Optional source questions to base content on
    count?: number; // Number of items to generate (default: 1)
}

/**
 * Generation result
 */
export interface GenerationResult<T = unknown> {
    success: boolean;
    content?: T;
    contentId?: string;
    error?: string;
    generationTime?: number; // ms
}

/**
 * Validation request for symbolic input
 */
export interface ValidationRequest {
    studentAnswer: string;
    expectedAnswer: string;
    alternativeForms?: string[];
    problemType?: 'algebraic' | 'trigonometric' | 'calculus' | 'linear_algebra';
}

/**
 * Validation result
 */
export interface ValidationResult {
    isEquivalent: boolean;
    confidence: number; // 0-1
    simplifiedStudent?: string;
    simplifiedExpected?: string;
    errorType?: string;
    hint?: string;
    parseError?: string;
}

/**
 * Exam processing result
 */
export interface ExamProcessingResult {
    success: boolean;
    examId?: string;
    questionsExtracted?: number;
    topicsIdentified?: string[];
    error?: string;
}

/**
 * Topic discovery result
 */
export interface TopicDiscoveryResult {
    courseId: string;
    areas: Array<{
        name: string;
        nameEn?: string;
        topics: Array<{
            id: string;
            name: string;
            examFrequency: number;
            avgPoints: number;
            prerequisites: string[];
            difficultyRange: [number, number];
        }>;
    }>;
}
