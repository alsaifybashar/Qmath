import { NextRequest, NextResponse } from 'next/server';

// AI Context Interface
interface AIContext {
    currentPage: 'study' | 'review' | 'exam' | 'progress';
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

// Build AI System Prompt Context Part
function buildAIContextPrompt(context: AIContext): string {
    const topicInfo = context.question?.topic ? `helping a student with ${context.question.topic}` : 'helping a student learn mathematics';

    let prompt = `You are a helpful, encouraging math tutor ${topicInfo}.\n`;

    if (context.question) {
        prompt += `
CURRENT QUESTION:
${context.question.content}

${context.question.correctAnswer ? `The correct answer is: ${context.question.correctAnswer} (DO NOT reveal this directly!)` : ''}`;
    }

    if (context.attempts && context.attempts.count > 0) {
        prompt += `

STUDENT ATTEMPTS:
- Number of attempts: ${context.attempts.count}
- Last answer tried: ${context.attempts.lastAnswer || 'Unknown'}
- Time spent: ${Math.round(context.attempts.timeSpent / 60)} minutes`;
    }

    prompt += `

STUDENT LEVEL:
- Current mastery: ${Math.round(context.student.masteryLevel * 100)}%
- Recent performance: ${context.student.recentPerformance}`;

    return prompt;
}

import Anthropic from '@anthropic-ai/sdk';
import { SOCRATIC_SYSTEM_PROMPT, getMathValidationTool, getPlotTool, getVisualWidgetTool } from '@/lib/ai/prompts/socratic';
import { symbolicValidator } from '@/lib/content-generation/symbolic-validator';
import { auth } from '@/auth';
import { retrieveContext } from '@/lib/ai/rag';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '', // defaults to process.env.ANTHROPIC_API_KEY
});

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

        // RAG Context Injection
        // We look up definitions/theorems related to the student's message or the current topic
        const searchQuery = `${context.question?.topic || ''} ${message}`;
        const ragContexts = await retrieveContext(searchQuery);

        let contextPrompt = buildAIContextPrompt(context);

        if (context.recentConcepts && context.recentConcepts.length > 0) {
            contextPrompt += `\n\nRECENT CONCEPTS VIEWED BY STUDENT:\n- ${context.recentConcepts.join('\n- ')}`;
        }

        if (context.uiState && context.uiState.activeWidget) {
            contextPrompt += `\n\nCURRENT UI STATE:\n- The student is currently interacting with the '${context.uiState.activeWidget}' widget.`;
        }

        if (ragContexts.length > 0) {
            contextPrompt += `\n\nCOURSE RELEVANT KNOWLEDGE (STRICT INSTRUCTION: You MUST use this context strictly. If the student asks something outside this theoretical context, do NOT invent theorems. Stick to the provided definitions to ensure they match the university syllabus):\n`;
            for (const rag of ragContexts) {
                contextPrompt += `- [From ${rag.source === 'article' ? 'Course Article' : 'Syllabus Topic'}]: ${rag.content}\n`;
            }
        }

        const systemPrompt = `${SOCRATIC_SYSTEM_PROMPT}\n\n${contextPrompt}`;

        const messages: Anthropic.MessageParam[] = context.conversationHistory
            ? context.conversationHistory.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            }))
            : [];

        messages.push({ role: 'user', content: message });

        const validationTool = getMathValidationTool();
        const plotTool = getPlotTool();
        const visualWidgetTool = getVisualWidgetTool();

        if (provider === 'ollama') {
            const ollamaMessages = [
                { role: 'system', content: systemPrompt },
                ...(context.conversationHistory || []).map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: message }
            ];

            const ollamaTools = [
                { type: "function", function: { name: validationTool.name, description: validationTool.description, parameters: validationTool.input_schema } },
                { type: "function", function: { name: plotTool.name, description: plotTool.description, parameters: plotTool.input_schema } },
                { type: "function", function: { name: visualWidgetTool.name, description: visualWidgetTool.description, parameters: visualWidgetTool.input_schema } }
            ];

            const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'qwen3:8b', // Updated to use the available local model
                    messages: ollamaMessages,
                    tools: ollamaTools,
                    stream: false,
                    options: { num_ctx: 4096 }
                })
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
                    visualWidgetData = { type: args.type, props: args.props };
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
                    const secondRes = await fetch('http://localhost:11434/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: 'qwen3:8b',
                            messages: ollamaMessages,
                            stream: false,
                            options: { num_ctx: 4096 }
                        })
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

        // Anthropic Flow follows
        let response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            system: systemPrompt,
            messages: messages,
            tools: [validationTool, plotTool, visualWidgetTool],
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
                    content: [
                        {
                            type: 'tool_result',
                            tool_use_id: toolCall.id,
                            content: JSON.stringify(validationResult)
                        }
                    ]
                };

                // Add assistant tool use message & user tool result to conversation
                messages.push({ role: 'assistant', content: response.content });
                messages.push(toolMessage);

                // Call Anthropic again to generate response based on tool result
                response = await anthropic.messages.create({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 500,
                    system: systemPrompt,
                    messages: messages,
                    tools: [validationTool, plotTool, visualWidgetTool],
                });
            } else if (toolCall && toolCall.name === 'plot_function') {
                const args = toolCall.input as { expression: string; title: string; x_range?: [number, number]; y_range?: [number, number] };
                plotData = args;

                const toolMessage: Anthropic.MessageParam = {
                    role: 'user',
                    content: [
                        {
                            type: 'tool_result',
                            tool_use_id: toolCall.id,
                            content: JSON.stringify({ success: true, message: "Plot rendered correctly in the UI." })
                        }
                    ]
                };

                messages.push({ role: 'assistant', content: response.content });
                messages.push(toolMessage);

                response = await anthropic.messages.create({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 500,
                    system: systemPrompt,
                    messages: messages,
                    tools: [validationTool, plotTool, visualWidgetTool],
                });
            } else if (toolCall && toolCall.name === 'render_visual_widget') {
                const args = toolCall.input as { type: string; props: any };
                visualWidgetData = {
                    type: args.type,
                    props: args.props
                };

                const toolMessage: Anthropic.MessageParam = {
                    role: 'user',
                    content: [
                        {
                            type: 'tool_result',
                            tool_use_id: toolCall.id,
                            content: JSON.stringify({ success: true, message: "Interactive widget launched in the UI." })
                        }
                    ]
                };

                messages.push({ role: 'assistant', content: response.content });
                messages.push(toolMessage);

                response = await anthropic.messages.create({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 500,
                    system: systemPrompt,
                    messages: messages,
                    tools: [validationTool, plotTool, visualWidgetTool],
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
        console.error('AI Chat Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to process AI request',
                details: error instanceof Error ? error.message : 'Unknown error'
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
