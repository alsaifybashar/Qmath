import { NextRequest, NextResponse } from 'next/server';

// AI Context Interface
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
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    uiState?: {
        activeWidget?: string;
        currentInputValue?: string;
        isVisible: boolean;
    };
    recentConcepts?: string[];
}

// Build context section appended after the base system prompt
function buildAIContextPrompt(context: AIContext): string {
    const isExplore = context.mode === 'explore';

    let prompt = '';

    if (isExplore) {
        // Exploration mode: share student context without question-specific focus
        prompt += `\nSTUDENT CONTEXT:\n`;
        prompt += `- Mastery level: ${Math.round(context.student.masteryLevel * 100)}%\n`;
        prompt += `- Recent performance: ${context.student.recentPerformance}\n`;

        if (context.recentConcepts && context.recentConcepts.length > 0) {
            prompt += `- Topics the student has recently studied: ${context.recentConcepts.join(', ')}\n`;
            prompt += `  (Use these to make connections and tailor depth of explanation.)\n`;
        }
    } else {
        // Guided mode: full question context for Socratic tutoring
        const topicInfo = context.question?.topic ? `helping a student with ${context.question.topic}` : 'helping a student learn mathematics';
        prompt += `You are currently ${topicInfo}.\n`;

        if (context.question) {
            prompt += `\nCURRENT QUESTION:\n${context.question.content}\n`;
            if (context.question.correctAnswer) {
                prompt += `\nThe correct answer is: ${context.question.correctAnswer} (DO NOT reveal this directly!)\n`;
            }
        }

        if (context.attempts && context.attempts.count > 0) {
            prompt += `\nSTUDENT ATTEMPTS:\n`;
            prompt += `- Number of attempts: ${context.attempts.count}\n`;
            prompt += `- Last answer tried: ${context.attempts.lastAnswer || 'Unknown'}\n`;
            prompt += `- Time spent: ${Math.round(context.attempts.timeSpent / 60)} minutes\n`;
        }

        prompt += `\nSTUDENT LEVEL:\n`;
        prompt += `- Current mastery: ${Math.round(context.student.masteryLevel * 100)}%\n`;
        prompt += `- Recent performance: ${context.student.recentPerformance}\n`;

        if (context.recentConcepts && context.recentConcepts.length > 0) {
            prompt += `\nRECENT CONCEPTS VIEWED:\n- ${context.recentConcepts.join('\n- ')}\n`;
        }
    }

    if (context.uiState && context.uiState.activeWidget) {
        prompt += `\nCURRENT UI STATE:\n- The student is currently interacting with the '${context.uiState.activeWidget}' widget.\n`;
    }

    return prompt;
}

import Anthropic from '@anthropic-ai/sdk';
import { SOCRATIC_SYSTEM_PROMPT, EXPLORER_SYSTEM_PROMPT, getMathValidationTool, getPlotTool, getVisualWidgetTool } from '@/lib/ai/prompts/socratic';
import { symbolicValidator } from '@/lib/content-generation/symbolic-validator';
import { auth } from '@/auth';
import { retrieveContext } from '@/lib/ai/rag';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/** How long to wait for Ollama before aborting (ms). */
const OLLAMA_TIMEOUT_MS = 55_000; // 55 s — well under undici's 300 s default

/**
 * Fetch from the local Ollama server with an automatic timeout.
 * Throws an AbortError (name === 'AbortError') when the timeout fires.
 */
async function fetchOllama(body: object): Promise<Response> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), OLLAMA_TIMEOUT_MS);
    try {
        return await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: ctrl.signal,
        });
    } finally {
        clearTimeout(timer);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, context, provider = 'anthropic' } = body as {
            message: string;
            context: AIContext;
            provider?: 'anthropic' | 'ollama';
        };

        if (!message || !context) {
            return NextResponse.json(
                { error: 'Message and context are required' },
                { status: 400 }
            );
        }

        // Security Audit: Check Auth
        const session = await auth();
        if (!session || !session.user) {
            if (process.env.NODE_ENV !== 'development') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // Security Audit: Limit message length
        if (message.length > 2000) {
            return NextResponse.json({ error: 'Message payload too large' }, { status: 413 });
        }

        // Determine mode: explicit 'explore' mode OR no question context → exploration
        const isExploreMode = context.mode === 'explore' || !context.question?.correctAnswer;
        const baseSystemPrompt = isExploreMode ? EXPLORER_SYSTEM_PROMPT : SOCRATIC_SYSTEM_PROMPT;
        // Exploration mode allows longer responses for richer explanations.
        // 2000 gives Claude room for a full structured explanation + widget in the same reply.
        const maxTokens = isExploreMode ? 2000 : 600;

        // RAG Context Injection
        const searchQuery = `${context.question?.topic || ''} ${message}`;
        const ragContexts = await retrieveContext(searchQuery);

        let contextPrompt = buildAIContextPrompt(context);

        if (ragContexts.length > 0) {
            const ragInstruction = isExploreMode
                ? '\n\nCOURSE KNOWLEDGE (use this to align explanations with the university syllabus):\n'
                : '\n\nCOURSE RELEVANT KNOWLEDGE (STRICT INSTRUCTION: You MUST use this context strictly. Stick to provided definitions to ensure they match the university syllabus):\n';
            contextPrompt += ragInstruction;
            for (const rag of ragContexts) {
                contextPrompt += `- [From ${rag.source === 'article' ? 'Course Article' : 'Syllabus Topic'}]: ${rag.content}\n`;
            }
        }

        const systemPrompt = `${baseSystemPrompt}\n\n${contextPrompt}`;

        const messages: Anthropic.MessageParam[] = context.conversationHistory
            ? context.conversationHistory.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            }))
            : [];

        messages.push({ role: 'user', content: message });

        const validationTool = getMathValidationTool();
        const plotTool = getPlotTool();
        const visualWidgetTool = getVisualWidgetTool(provider);

        if (provider === 'ollama') {
            const ollamaMessages = [
                { role: 'system', content: systemPrompt },
                ...(context.conversationHistory || []).map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: message }
            ];

            // In explore mode, exclude validate_math tool (no specific question to validate against)
            const ollamaTools = [
                ...(!isExploreMode ? [{ type: "function", function: { name: validationTool.name, description: validationTool.description, parameters: validationTool.input_schema } }] : []),
                { type: "function", function: { name: plotTool.name, description: plotTool.description, parameters: plotTool.input_schema } },
                { type: "function", function: { name: visualWidgetTool.name, description: visualWidgetTool.description, parameters: visualWidgetTool.input_schema } }
            ];

            const ollamaResponse = await fetchOllama({
                model: process.env.OLLAMA_MODEL || 'kimi-k2.5:cloud',
                messages: ollamaMessages,
                tools: ollamaTools,
                stream: false,
                options: { num_ctx: 8192 },
            });

            if (!ollamaResponse.ok) {
                const errText = await ollamaResponse.text();
                throw new Error(`Ollama API Error: ${errText}`);
            }

            const ollamaData = await ollamaResponse.json();
            let msgObj = ollamaData.message;
            let plotData: any = null;
            let visualWidgetData: any = null;

            if (msgObj.tool_calls && msgObj.tool_calls.length > 0) {
                const toolCall = msgObj.tool_calls[0].function;
                const args = toolCall.arguments;

                if (toolCall.name === 'plot_function') {
                    plotData = args;
                    ollamaMessages.push(msgObj);
                    ollamaMessages.push({ role: 'tool', content: "Plot rendered correctly in the UI." });
                } else if (toolCall.name === 'render_visual_widget') {
                    // Normalize: new schema uses widget_type, legacy uses type
                    const rawArgs = typeof args === 'string' ? JSON.parse(args) : args;
                    const widgetType = rawArgs.widget_type || rawArgs.type;
                    const widgetConfig = rawArgs.config || rawArgs.props || {};
                    visualWidgetData = { type: widgetType, props: widgetConfig };
                    ollamaMessages.push(msgObj);
                    ollamaMessages.push({ role: 'tool', content: "Interactive widget launched in the UI." });
                } else if (toolCall.name === 'validate_math') {
                    const validationResult = await symbolicValidator.validate({
                        studentAnswer: args.student_expression,
                        expectedAnswer: args.expected_expression,
                    });
                    ollamaMessages.push(msgObj);
                    ollamaMessages.push({ role: 'tool', content: JSON.stringify(validationResult) });
                }

                if (ollamaMessages[ollamaMessages.length - 1].role === 'tool') {
                    const secondRes = await fetchOllama({
                        model: process.env.OLLAMA_MODEL || 'kimi-k2.5:cloud',
                        messages: ollamaMessages,
                        stream: false,
                        options: { num_ctx: 8192 },
                    });
                    const secondData = await secondRes.json();
                    msgObj = secondData.message;
                }
            }

            return NextResponse.json({
                success: true,
                response: msgObj.content || "Processed your request using local Ollama model.",
                plot: plotData,
                visualWidget: visualWidgetData
            });
        }

        // Anthropic Flow
        const anthropicTools: Anthropic.Tool[] = [
            ...(!isExploreMode ? [validationTool] : []),
            plotTool,
            visualWidgetTool,
        ];

        let response = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: messages,
            tools: anthropicTools,
        });

        let plotData: any = null;
        let visualWidgetData: any = null;

        // Handle tool calls
        if (response.stop_reason === 'tool_use') {
            const toolCall = response.content.find(
                (c) => c.type === 'tool_use'
            ) as Anthropic.ToolUseBlock;

            if (toolCall && toolCall.name === 'validate_math') {
                const args = toolCall.input as { student_expression: string; expected_expression: string };
                const validationResult = await symbolicValidator.validate({
                    studentAnswer: args.student_expression,
                    expectedAnswer: args.expected_expression,
                });

                const toolMessage: Anthropic.MessageParam = {
                    role: 'user',
                    content: [{ type: 'tool_result', tool_use_id: toolCall.id, content: JSON.stringify(validationResult) }]
                };

                messages.push({ role: 'assistant', content: response.content });
                messages.push(toolMessage);

                response = await anthropic.messages.create({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: maxTokens,
                    system: systemPrompt,
                    messages: messages,
                    tools: anthropicTools,
                });
            } else if (toolCall && toolCall.name === 'plot_function') {
                const args = toolCall.input as { expression: string; title: string; x_range?: [number, number]; y_range?: [number, number] };
                plotData = args;

                const toolMessage: Anthropic.MessageParam = {
                    role: 'user',
                    content: [{ type: 'tool_result', tool_use_id: toolCall.id, content: JSON.stringify({ success: true, message: "Plot rendered correctly in the UI." }) }]
                };

                messages.push({ role: 'assistant', content: response.content });
                messages.push(toolMessage);

                response = await anthropic.messages.create({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: maxTokens,
                    system: systemPrompt,
                    messages: messages,
                    tools: anthropicTools,
                });
            } else if (toolCall && toolCall.name === 'render_visual_widget') {
                const args = toolCall.input as { widget_type?: string; type?: string; config?: any; props?: any };
                const widgetType = args.widget_type || args.type;
                const widgetConfig = args.config || args.props || {};
                visualWidgetData = { type: widgetType, props: widgetConfig };

                const toolMessage: Anthropic.MessageParam = {
                    role: 'user',
                    content: [{ type: 'tool_result', tool_use_id: toolCall.id, content: JSON.stringify({ success: true, message: "Interactive widget launched in the UI." }) }]
                };

                messages.push({ role: 'assistant', content: response.content });
                messages.push(toolMessage);

                response = await anthropic.messages.create({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: maxTokens,
                    system: systemPrompt,
                    messages: messages,
                    tools: anthropicTools,
                });
            }
        }

        // Extract the final text response
        const textContent = response.content.find(c => c.type === 'text');
        const finalResponseText = textContent && textContent.type === 'text'
            ? textContent.text
            : "I'm having trouble formulating a response. What are your thoughts on the problem?";

        return NextResponse.json({
            success: true,
            response: finalResponseText,
            plot: plotData,
            visualWidget: visualWidgetData
        });

    } catch (error) {
        // Distinguish an Ollama timeout from other errors so the client can show
        // a more helpful message (e.g. "switch to Claude").
        const isAbort =
            error instanceof Error &&
            (error.name === 'AbortError' || (error as any).code === 'UND_ERR_HEADERS_TIMEOUT');

        if (isAbort) {
            return NextResponse.json(
                {
                    error: 'Local AI timed out',
                    details: `Ollama did not respond within ${OLLAMA_TIMEOUT_MS / 1000} seconds. ` +
                        'The model may still be loading or your prompt is too long. ' +
                        'Try a shorter message, wait a moment, or switch to Claude.',
                },
                { status: 503 }
            );
        }

        console.error('AI Chat Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to process AI request',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// Optional: Handle GET for health check
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'AI Chat API',
        version: '1.0.0',
        note: 'POST to this endpoint with {message, context} to get AI tutoring responses'
    });
}
