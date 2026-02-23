/**
 * Content Generator
 * 
 * Main service for generating mathematical content using AI.
 * Supports all 8 content types defined in content_generation.md.
 */

import { db } from '@/db/drizzle';
import { topics } from '@/db/schema';
import { generatedContent } from '@/db/content-schema';
import { eq } from 'drizzle-orm';
import { callOllama } from '@/lib/ollama';
import type {
    GenerationRequest,
    GenerationResult,
    ContentType,
    FreeFormSymbolicContent,
    FadedWorkedExampleContent,
    ParsonsContent,
    ErrorSpottingContent
} from './types';
import {
    FREE_FORM_SYMBOLIC_PROMPT,
    FADED_EXAMPLE_PROMPT,
    PARSONS_PROMPT,
    ERROR_SPOTTING_PROMPT
} from './prompts/index';

export class ContentGenerator {
    private aiProvider: string;

    constructor(aiProvider: string = 'ollama') {
        this.aiProvider = aiProvider;
    }

    /**
     * Generate content for a topic
     */
    async generate<T>(request: GenerationRequest): Promise<GenerationResult<T>> {
        const startTime = Date.now();

        try {
            // Get topic info
            const topic = await db.query.topics.findFirst({
                where: eq(topics.id, request.topicId),
            });

            if (!topic) {
                return { success: false, error: 'Topic not found' };
            }

            // Get prompt template based on content type
            const prompt = this.buildPrompt(request, topic);

            // Call AI provider
            const content = await this.callAI(prompt, request.contentType);

            // Validate generated content structure
            const validatedContent = this.validateContentStructure(content, request.contentType);

            if (!validatedContent) {
                return { success: false, error: 'Generated content failed structure validation' };
            }

            // Save to database
            const [saved] = await db.insert(generatedContent).values({
                topicId: request.topicId,
                contentType: request.contentType,
                content: validatedContent,
                difficulty: request.difficulty,
                sourceExamQuestions: request.sourceExamQuestionIds,
                generatedBy: this.aiProvider,
                generationPrompt: prompt,
                verificationStatus: 'pending',
            }).returning();

            return {
                success: true,
                content: validatedContent as T,
                contentId: saved.id,
                generationTime: Date.now() - startTime,
            };

        } catch (error) {
            console.error('Content generation failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Build prompt for content generation
     */
    private buildPrompt(request: GenerationRequest, topic: { title: string; description?: string | null }): string {
        const baseContext = `
TOPIC: ${topic.title}
DESCRIPTION: ${topic.description || 'No description available'}
TARGET DIFFICULTY: ${request.difficulty ?? 0.5}
`;

        switch (request.contentType) {
            case 'free_form_symbolic':
                return FREE_FORM_SYMBOLIC_PROMPT.replace('{context}', baseContext);
            case 'faded_worked_example':
                return FADED_EXAMPLE_PROMPT.replace('{context}', baseContext);
            case 'parsons_problem':
                return PARSONS_PROMPT.replace('{context}', baseContext);
            case 'error_spotting':
                return ERROR_SPOTTING_PROMPT.replace('{context}', baseContext);
            default:
                throw new Error(`Unsupported content type: ${request.contentType}`);
        }
    }

    /**
     * Call AI provider to generate content
     */
    private async callAI(prompt: string, contentType: ContentType): Promise<unknown> {
        // Return mock content if using mock provider
        if (this.aiProvider === 'mock') {
            return this.getMockContent(contentType);
        }

        // Ollama local model integration
        if (this.aiProvider === 'ollama') {
            try {
                const raw = await callOllama({
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert mathematics educator creating content for Swedish university engineering students. Always respond with valid JSON only, no markdown code blocks or additional text.',
                        },
                        {
                            role: 'user',
                            content: prompt + '\n\nRespond with ONLY the JSON object, no additional text or markdown.',
                        },
                    ],
                    maxTokens: 2048,
                    temperature: 0.3,
                    timeoutMs: 90_000,
                });

                // Strip markdown code fences if the model added them
                const cleanJson = raw.replace(/^```json\n?|\n?```$/g, '').trim();
                return JSON.parse(cleanJson);
            } catch (error) {
                console.error('Ollama API error:', error);
                console.warn('Falling back to mock content due to Ollama error');
                return this.getMockContent(contentType);
            }
        }

        // Unknown provider - fall back to mock
        console.warn(`Unknown AI provider: ${this.aiProvider}, falling back to mock`);
        return this.getMockContent(contentType);
    }

    /**
     * Validate that generated content matches expected structure
     */
    private validateContentStructure(content: unknown, contentType: ContentType): unknown | null {
        if (!content || typeof content !== 'object') {
            return null;
        }

        const obj = content as Record<string, unknown>;

        switch (contentType) {
            case 'free_form_symbolic':
                if (!obj.problem || !obj.expectedAnswer) return null;
                return content as FreeFormSymbolicContent;

            case 'faded_worked_example':
                if (!obj.problem || !obj.solutionSteps || !obj.levels) return null;
                return content as FadedWorkedExampleContent;

            case 'parsons_problem':
                if (!obj.problemStatement || !obj.correctOrder) return null;
                return content as ParsonsContent;

            case 'error_spotting':
                if (!obj.problem || !obj.solution || obj.errorLine === undefined) return null;
                return content as ErrorSpottingContent;

            default:
                return content;
        }
    }

    /**
     * Get mock content for testing
     */
    private getMockContent(contentType: ContentType): unknown {
        switch (contentType) {
            case 'free_form_symbolic':
                return {
                    problem: 'Simplify the expression: \\(\\frac{x^2 - 1}{x - 1}\\)',
                    problemMath: '\\frac{x^2 - 1}{x - 1}',
                    expectedAnswer: 'x + 1',
                    alternativeForms: ['1 + x', '(x+1)'],
                    hints: [
                        'Try factoring the numerator',
                        'Remember: a² - b² = (a+b)(a-b)'
                    ],
                    explanation: 'Factor the numerator as a difference of squares: x² - 1 = (x+1)(x-1). Then cancel (x-1) from numerator and denominator.'
                } satisfies FreeFormSymbolicContent;

            case 'faded_worked_example':
                return {
                    problem: 'Find the derivative of f(x) = x² sin(x)',
                    solutionSteps: [
                        { content: 'Apply the product rule: (uv)\' = u\'v + uv\'', explanation: 'Recognize this as a product of two functions' },
                        { content: 'Let u = x², v = sin(x)', explanation: 'Identify the two factors' },
                        { content: 'u\' = 2x, v\' = cos(x)', explanation: 'Differentiate each factor' },
                        { content: 'f\'(x) = 2x·sin(x) + x²·cos(x)', explanation: 'Apply the formula' },
                    ],
                    levels: [
                        { level: 1, prefilledSteps: [0, 1, 2], studentSteps: [3] },
                        { level: 2, prefilledSteps: [0, 1], studentSteps: [2, 3] },
                        { level: 3, prefilledSteps: [], studentSteps: [0, 1, 2, 3] },
                    ],
                    hints: ['What rule applies when differentiating a product?']
                } satisfies FadedWorkedExampleContent;

            default:
                return { problem: 'Mock content', type: contentType };
        }
    }
}

// Export singleton instance
export const contentGenerator = new ContentGenerator(process.env.AI_PROVIDER || 'ollama');
