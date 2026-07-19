import { NextRequest, NextResponse } from 'next/server';
import type Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI, SchemaType, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { auth } from '@/auth';
import {
    SOCRATIC_SYSTEM_PROMPT,
    EXPLORER_SYSTEM_PROMPT,
    buildGeminiSystemPrompt,
    getMathValidationTool,
    getPlotTool,
    getVisualWidgetTool,
} from '@/lib/ai/prompts/socratic';
import { callOllama } from '@/lib/ollama';
import { checkRateLimit } from '@/lib/rate-limit';
import { preprocessUserInput } from '@/lib/ai/preprocessor';
import { db } from '@/db/drizzle';
import { questions, topics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logAIRequest } from '@/lib/ai-logger';
import { evaluateSafeExpression } from '@/lib/math/safe-expression';
import { z } from 'zod';
import { parseStrictJson, problem, requireSameOrigin } from '@/lib/security/request';
import { requireCourseViewer } from '@/lib/auth';
import {
    anthropicModel,
    createAnthropicClient,
    isAnthropicConfigured,
} from '@/lib/ai/anthropic-client';

const anthropic = createAnthropicClient();
const genAI = process.env.GOOGLE_GENERATIVE_AI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    : null;

const MESSAGE_MAX_CHARS = 2000;
const HISTORY_MAX_MESSAGES = 20;
const ALLOWED_ANTHROPIC_MODELS = new Set([
    'claude-sonnet-4-6',
    'claude-haiku-4-5-20251001',
    'claude-3-5-sonnet-20241022',
]);
const ALLOWED_GOOGLE_MODELS = new Set([
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro',
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite-preview',
    'gemini-3.1-pro-preview',
]);

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface StudentContext {
    currentPage: string;
    mode?: 'explore' | 'guided';
    /**
     * Preferred: send only questionId — the server fetches the full guided-mode
     * question context from the DB so the browser does not need to send the
     * question body or the correct answer on each turn.
     */
    questionId?: string;
    /** Legacy / non-DB path: full question object (correctAnswer omitted by client). */
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
        recentPerformance: string;
    };
    conversationHistory?: ChatMessage[];
}

const chatRequestSchema = z.object({
    message: z.string().trim().min(1).max(MESSAGE_MAX_CHARS),
    provider: z.enum(['anthropic', 'google', 'ollama']).default('anthropic'),
    model: z.string().regex(/^[a-zA-Z0-9._:-]{1,100}$/).optional(),
    context: z.object({
        currentPage: z.string().max(200),
        mode: z.enum(['explore', 'guided']).optional(),
        questionId: z.string().uuid().optional(),
        question: z.object({
            id: z.string().max(100),
            content: z.string().max(5000),
            topic: z.string().max(200),
            difficulty: z.number().int().min(1).max(5),
        }).strict().optional(),
        attempts: z.object({
            count: z.number().int().min(0).max(1000),
            lastAnswer: z.string().max(1000).optional(),
            timeSpent: z.number().min(0).max(24 * 60 * 60),
        }).strict().optional(),
        student: z.object({
            masteryLevel: z.number().min(0).max(1),
            recentPerformance: z.string().max(500),
        }).strict(),
        conversationHistory: z.array(z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string().max(MESSAGE_MAX_CHARS),
        }).strict()).max(HISTORY_MAX_MESSAGES).optional(),
        uiState: z.object({
            activeWidget: z.string().max(100).optional(),
            currentInputValue: z.string().max(1000).optional(),
            isVisible: z.boolean(),
        }).strict().optional(),
        recentConcepts: z.array(z.string().max(100)).max(30).optional(),
    }).strict(),
}).strict();

// ─── Server-side guided-question lookup ───────────────────────────────────────
//
// For secure guided tutoring, the DB is the source of truth for the question
// prompt context. That lets the client send only a stable questionId while the
// server resolves the exact question text, topic, difficulty, and correct answer.

async function fetchQuestionContextById(questionId: string): Promise<NonNullable<StudentContext['question']> | null> {
    const row = await db
        .select({
            id: questions.id,
            content: questions.contentMarkdown,
            difficulty: questions.difficultyTier,
            correctAnswer: questions.correctAnswer,
            isPublished: questions.isPublished,
            courseId: topics.courseId,
            topicTitle: topics.title,
            topicTitleSv: topics.titleSv,
        })
        .from(questions)
        .leftJoin(topics, eq(questions.topicId, topics.id))
        .where(eq(questions.id, questionId))
        .limit(1);

    const question = row[0];
    if (!question?.courseId) return null;
    const viewer = await requireCourseViewer(question.courseId);
    if (!question.isPublished && viewer.role === 'student') return null;

    return {
        id: question.id,
        content: question.content,
        topic: question.topicTitleSv ?? question.topicTitle ?? 'Matematik',
        difficulty: question.difficulty ?? 1,
        correctAnswer: question.correctAnswer,
    };
}

// ─── Math expression sanitization ────────────────────────────────────────────

const DANGEROUS_EXPRESSION_PATTERNS = [
    /__(proto|defineGetter|defineSetter|lookupGetter|lookupSetter)__/,
    /\beval\b/,
    /\bFunction\b/,
    /\bdocument\b/,
    /\bwindow\b/,
    /\bprocess\b/,
];

function sanitizeMathExpression(expr: string): string {
    if (typeof expr !== 'string') return '';
    if (expr.length > 200) return expr.slice(0, 200);
    for (const pattern of DANGEROUS_EXPRESSION_PATTERNS) {
        if (pattern.test(expr)) return '0';
    }
    return expr;
}

// ─── Math validation (simple symbolic check via mathjs) ───────────────────────

async function validateMath(studentExpr: string, expectedExpr: string): Promise<boolean> {
    try {
        const scope = { x: Math.PI / 7, n: 5, t: 1.2 };
        const sv = evaluateSafeExpression(studentExpr, scope);
        const ev = evaluateSafeExpression(expectedExpr, scope);
        return typeof sv === 'number' && typeof ev === 'number' && Number.isFinite(sv) && Number.isFinite(ev)
            && Math.abs(sv - ev) < 1e-6;
    } catch {
        return false;
    }
}

// ─── Build Anthropic messages from history ────────────────────────────────────

function buildMessages(
    userMessage: string,
    history: ChatMessage[],
): Anthropic.MessageParam[] {
    const trimmedHistory = history.slice(-HISTORY_MAX_MESSAGES);
    const msgs: Anthropic.MessageParam[] = trimmedHistory.map((m) => ({
        role: m.role,
        content: m.content,
    }));
    msgs.push({ role: 'user', content: userMessage });
    return msgs;
}

// ─── Anthropic handler (with tool execution loop) ─────────────────────────────

async function handleAnthropic(
    userMessage: string,
    context: StudentContext,
    systemPrompt: string,
    model = 'claude-sonnet-4-6',
    userId?: string,
) {
    const tools: Anthropic.Tool[] = [
        getMathValidationTool() as Anthropic.Tool,
        getPlotTool() as Anthropic.Tool,
        getVisualWidgetTool('anthropic') as Anthropic.Tool,
    ];

    const messages = buildMessages(userMessage, context.conversationHistory ?? []);

    // Prompt caching: the system prompt (which includes the question context) is
    // marked ephemeral so Anthropic caches it for 5 minutes. Turns 2-N of the
    // same conversation hit the cache and cost ~10% of the uncached token price.
    const systemWithCache: Anthropic.TextBlockParam[] = [
        {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
        },
    ];

    let response = await anthropic.messages.create({
        model: anthropicModel(model),
        max_tokens: 2000,
        system: systemWithCache,
        tools,
        messages,
    });

    // Tool execution loop
    let plot: object | undefined;
    let visualWidget: object | undefined;

    while (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
        );

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
            let resultContent = '';

            if (toolUse.name === 'validate_math') {
                const { student_expression, expected_expression } = toolUse.input as {
                    student_expression: string;
                    expected_expression: string;
                };
                const isCorrect = await validateMath(student_expression, expected_expression);
                resultContent = JSON.stringify({ is_equivalent: isCorrect });
            } else if (toolUse.name === 'plot_function') {
                const input = toolUse.input as {
                    expression: string;
                    title: string;
                    x_range?: [number, number];
                    y_range?: [number, number];
                };
                plot = {
                    expression: input.expression,
                    title: input.title,
                    x_range: input.x_range,
                    y_range: input.y_range,
                };
                resultContent = JSON.stringify({ status: 'rendered', expression: input.expression });
            } else if (toolUse.name === 'render_visual_widget') {
                const input = toolUse.input as { widget_type: string; config?: Record<string, unknown> };
                const expressionKeys = new Set(['expression', 'expression2', 'fExpression', 'gExpression',
                    'xExpr', 'yExpr', 'zExpr', 'fxExpr', 'fyExpr', 'fzExpr']);
                const sanitizedConfig: Record<string, unknown> = {};
                if (input.config) {
                    for (const [k, v] of Object.entries(input.config)) {
                        sanitizedConfig[k] = expressionKeys.has(k) && typeof v === 'string'
                            ? sanitizeMathExpression(v)
                            : v;
                    }
                }
                visualWidget = {
                    type: input.widget_type,
                    props: sanitizedConfig,
                };
                resultContent = JSON.stringify({ status: 'rendered', widget_type: input.widget_type });
            } else {
                resultContent = JSON.stringify({ error: 'Unknown tool' });
            }

            toolResults.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: resultContent,
            });
        }

        // Continue the conversation with tool results
        messages.push({ role: 'assistant', content: response.content });
        messages.push({ role: 'user', content: toolResults });

        response = await anthropic.messages.create({
            model: anthropicModel(model),
            max_tokens: 1500,
            system: systemWithCache,
            tools,
            messages,
        });
    }

    // Extract the final text response
    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    const assistantText = textBlock?.text ?? '';

    void logAIRequest({
        provider: 'anthropic',
        model,
        requestType: 'chat_tutor',
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        success: true,
        userId,
    });

    return { response: assistantText, plot, visualWidget };
}

// ─── Ollama handler ───────────────────────────────────────────────────────────

/**
 * Structured response format we ask Ollama to return.
 * Small models (llama3.2) don't reliably use tool_call protocol,
 * so we use JSON mode with explicit instructions instead.
 */
interface OllamaStructuredResponse {
    text: string;
    widget?: {
        type: string;
        config?: Record<string, unknown>;
    };
    plot?: {
        expression: string;
        title: string;
        x_range?: [number, number];
        y_range?: [number, number];
    };
}

const WIDGET_TYPES = [
    // Rich interactive widgets
    'PolynomialRootFinder', 'InteractiveUnitCircle', 'InequalitiesVisualizer',
    'VectorOperationsBoard', 'MatrixDeformationBoard', 'LinearSpanExplorer',
    'EigenvectorVisualizer', 'IntersectingPlanes3D', 'DerivativeDefinitionBoard',
    'CurveSketchingBoard', 'RiemannSumsVisualizer', 'TaylorSeriesApproximation',
    // Generic templates
    'function-plotter', 'secant-tangent', 'mean-value-theorem', 'antiderivative',
    'differentiability', 'continuity-epsilon-delta', 'taylor-series-sine',
    'power-series-exp', 'convergence-sequence', 'convergence-series',
    'differential-equations', 'logistic-process', 'projectile-motion',
    'complex-arithmetic', 'lagrange-interpolation', 'binomial-distribution',
    'bezier-curves', 'polar-grid', '3d-function-graph', '3d-curve', '3d-vector-field',
    'function-composer', 'linear-function-params', 'power-functions',
    'sine-cosine-functions', 'exploring-functions', 'shade-bounded-curves',
];

function buildOllamaSystemPrompt(basePrompt: string): string {
    return `${basePrompt}

---
RESPONSE FORMAT (CRITICAL — you MUST follow this exactly):
Respond with a single JSON object. No markdown, no code fences, just raw JSON.

Schema:
{
  "text": "Your explanation here (required, always provide a helpful response)",
  "widget": {
    "type": "widget-id-here",
    "config": { ...widget parameters... }
  }
}

The "widget" field is OPTIONAL. Include it ONLY when a visualization would help.
Available widget types: ${WIDGET_TYPES.join(', ')}

Widget config examples:
- function-plotter: { "expression": "sin(x)", "xMin": -6.28, "xMax": 6.28 }
- PolynomialRootFinder: { "initialRoot1": 2, "initialRoot2": -3 }
- RiemannSumsVisualizer: { "initialN": 8 }
- InteractiveUnitCircle: { "initialAngleDeg": 45 }
- DerivativeDefinitionBoard: { "initialH": 1.5 }
- TaylorSeriesApproximation: { "initialDegree": 5, "centerPoint": 0 }
- MatrixDeformationBoard: { "initialMatrix": [1, 0, 0, 1] }
- VectorOperationsBoard: { "initialU": [2, 3], "initialV": [1, -1] }
- differential-equations: { "expression": "-y", "x0": 0, "y0": 1 }
- 3d-function-graph: { "expression": "x^2+y^2" }
- taylor-series-sine: { "degree": 5, "center": 0 }
- binomial-distribution: { "n": 10, "p": 0.5 }

If no visualization is needed, omit the "widget" field entirely.
Example without widget: { "text": "The derivative of x^2 is 2x." }
Example with widget: { "text": "Here is sin(x) plotted for you.", "widget": { "type": "function-plotter", "config": { "expression": "sin(x)" } } }
`;
}

async function handleOllama(
    userMessage: string,
    context: StudentContext,
    systemPrompt: string,
    model?: string,
) {
    const history = (context.conversationHistory ?? []).slice(-HISTORY_MAX_MESSAGES);

    const messages = [
        { role: 'system' as const, content: buildOllamaSystemPrompt(systemPrompt) },
        ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: userMessage },
    ];

    // Use JSON format mode — the only reliable way with small models like llama3.2
    const rawText = await callOllama({
        messages,
        maxTokens: 2000,
        temperature: 0.2,
        timeoutMs: 60_000,
        numCtx: 8192,
        format: 'json',
        model,
    });

    // Parse the structured JSON response
    let structured: OllamaStructuredResponse;
    try {
        // Try to extract JSON even if the model wrapped it in markdown
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : rawText;
        structured = JSON.parse(jsonStr) as OllamaStructuredResponse;
    } catch {
        // If JSON parsing fails, treat the entire response as plain text
        return { response: rawText };
    }

    const responseText = structured.text ?? rawText;
    let visualWidget: { type: string; props: Record<string, unknown> } | undefined;
    let plot: object | undefined;

    // Extract widget if provided and valid
    if (structured.widget?.type && WIDGET_TYPES.includes(structured.widget.type)) {
        visualWidget = {
            type: structured.widget.type,
            props: structured.widget.config ?? {},
        };
    }

    // Extract plot if provided
    if (structured.plot?.expression) {
        plot = structured.plot;
    }

    return { response: responseText, visualWidget, plot };
}


// ─── Build system prompt ──────────────────────────────────────────────────────

function buildSystemPrompt(context: StudentContext): string {
    const isGuided = context.mode === 'guided' && !!context.question;

    if (!isGuided) return EXPLORER_SYSTEM_PROMPT;

    const { question, attempts, student } = context;
    const contextBlock = [
        `\n\n--- CURRENT QUESTION CONTEXT ---`,
        `Topic: ${question!.topic}`,
        `Difficulty: ${question!.difficulty}/5`,
        `Question: ${question!.content}`,
        question!.correctAnswer ? `Expected answer: ${question!.correctAnswer}` : null,
        attempts ? `Attempt #${attempts.count} | Last answer: ${attempts.lastAnswer ?? 'none'} | Time: ${Math.round(attempts.timeSpent / 1000)}s` : null,
        `Student mastery level: ${Math.round(student.masteryLevel * 100)}%`,
        `Recent performance: ${student.recentPerformance}`,
    ]
        .filter(Boolean)
        .join('\n');

    return SOCRATIC_SYSTEM_PROMPT + contextBlock;
}

// ─── Gemini handler (with function calling loop) ───────────────────────────────

async function handleGemini(
    userMessage: string,
    context: StudentContext,
    _systemPrompt: string,  // unused — Gemini uses its own optimised prompt
    modelName = 'gemini-2.5-pro',
) {
    if (!genAI) {
        throw new Error('Google Generative AI not configured');
    }

    // Build Gemini-optimised system prompt (XML-tagged, motivational teacher persona)
    const geminiSystemPrompt = buildGeminiSystemPrompt(context);

    // Map tools to Gemini format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tools: any[] = [
        {
            functionDeclarations: [
                {
                    name: 'validate_math',
                    description: 'Evaluates whether the student\'s mathematical expression is equivalent to the expected correct answer. Call this for ANY algebraic verification — never evaluate symbolic algebra yourself.',
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            student_expression: { type: SchemaType.STRING, description: 'The math expression provided by the student.' },
                            expected_expression: { type: SchemaType.STRING, description: 'The correct target expression to verify against.' },
                        },
                        required: ['student_expression', 'expected_expression'],
                    },
                },
                {
                    name: 'plot_function',
                    description: 'Generates an interactive 2D graph of a mathematical function. Use when the student asks to "plot", "sketch", "draw", or "visualise" a function, or when a graph would clarify the concept.',
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            expression: { type: SchemaType.STRING, description: 'The function expression to plot using x as variable (e.g. "sin(x)", "x^2 - 3*x + 2").' },
                            title: { type: SchemaType.STRING, description: 'A short descriptive title for the graph.' },
                            x_range: { type: SchemaType.ARRAY, items: { type: SchemaType.NUMBER }, description: '[min, max] x-axis range.' },
                            y_range: { type: SchemaType.ARRAY, items: { type: SchemaType.NUMBER }, description: '[min, max] y-axis range (optional).' },
                        },
                        required: ['expression', 'title'],
                    },
                },
                {
                    name: 'render_visual_widget',
                    description: 'Launch an interactive JSXGraph math visualisation. Call this proactively whenever a visual would deepen understanding. MANDATORY when the student says "sketch", "plot", "draw", "visualise", "rita", or "skissa" — never describe a graph in plain text.',
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            widget_type: { type: SchemaType.STRING, description: 'The widget type matching the mathematical topic (e.g. "function-plotter", "PolynomialRootFinder", "DerivativeDefinitionBoard").' },
                            config: { type: SchemaType.OBJECT, description: 'Widget configuration with values extracted from the student\'s question — never use generic defaults when specific values exist.' },
                        },
                        required: ['widget_type'],
                    },
                },
            ],
        },
    ];

    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,  threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,  threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
    ];

    // Best-practice generation config for Gemini:
    // • temperature = 1.0  — required for thinking models (Google's recommendation)
    // • topP = 0.95        — diverse but focused sampling
    // • maxOutputTokens    — 65536 to accommodate thinking tokens + full response
    // • thinkingConfig     — medium budget on Pro for deeper reasoning without excess cost;
    //                        Flash models skip thinking to stay fast and work on free tier
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generationConfig: any = {
        temperature: 1.0,
        topP: 0.95,
        maxOutputTokens: 65536,
    };

    const isProModel = modelName.includes('pro');
    const isLiteModel = modelName.includes('lite');

    if (isProModel) {
        // Pro models (2.5 Pro, 3.x Pro): enable extended thinking for deep math reasoning
        generationConfig.thinkingConfig = {
            thinkingBudget: 8000,
        };
    } else if (isLiteModel) {
        // Lite/Micro models: optimise for speed — lower temperature, smaller output budget
        generationConfig.temperature = 0.5;
        generationConfig.maxOutputTokens = 4096;
    } else {
        // Flash variants: balance speed and quality
        generationConfig.temperature = 0.7;
    }

    const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: geminiSystemPrompt,
        tools,
        safetySettings,
        generationConfig,
    });

    const history = (context.conversationHistory ?? []).slice(-HISTORY_MAX_MESSAGES).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
        history,
    });

    let result = await chat.sendMessage(userMessage);
    let response = result.response;
    let calls = response.functionCalls();

    let plot: object | undefined;
    let visualWidget: object | undefined;

    // Tool execution loop
    let iterations = 0;
    while (calls && calls.length > 0 && iterations < 5) {
        iterations++;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const toolResults: any[] = [];

        for (const call of calls) {
            if (call.name === 'validate_math') {
                const args = call.args as { student_expression: string; expected_expression: string };
                const isCorrect = await validateMath(args.student_expression, args.expected_expression);
                toolResults.push({
                    functionResponse: {
                        name: 'validate_math',
                        response: { is_equivalent: isCorrect },
                    },
                });
            } else if (call.name === 'plot_function') {
                const input = call.args as { 
                    expression: string; 
                    title: string; 
                    x_range?: [number, number]; 
                    y_range?: [number, number] 
                };
                plot = {
                    expression: input.expression,
                    title: input.title,
                    x_range: input.x_range,
                    y_range: input.y_range,
                };
                toolResults.push({
                    functionResponse: {
                        name: 'plot_function',
                        response: { status: 'rendered', expression: input.expression },
                    },
                });
            } else if (call.name === 'render_visual_widget') {
                const input = call.args as { 
                    widget_type: string; 
                    config?: Record<string, unknown> 
                };
                const expressionKeys = new Set(['expression', 'expression2', 'fExpression', 'gExpression',
                    'xExpr', 'yExpr', 'zExpr', 'fxExpr', 'fyExpr', 'fzExpr']);
                const sanitizedConfig: Record<string, unknown> = {};
                if (input.config) {
                    for (const [k, v] of Object.entries(input.config)) {
                        sanitizedConfig[k] = expressionKeys.has(k) && typeof v === 'string'
                            ? sanitizeMathExpression(v)
                            : v;
                    }
                }
                visualWidget = {
                    type: input.widget_type,
                    props: sanitizedConfig,
                };
                toolResults.push({
                    functionResponse: {
                        name: 'render_visual_widget',
                        response: { status: 'rendered', widget_type: input.widget_type },
                    },
                });
            }
        }

        if (toolResults.length > 0) {
            result = await chat.sendMessage(toolResults);
            response = result.response;
            calls = response.functionCalls();
        } else {
            calls = [];
        }
    }

    return { response: response.text(), plot, visualWidget };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    // 1. Auth check
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const csrfFailure = requireSameOrigin(req);
    if (csrfFailure) return csrfFailure;

    // 1b. Rate limit check
    const { allowed, resetAt } = await checkRateLimit(session.user.id, 'ai');
    if (!allowed) {
        return NextResponse.json(
            { error: 'Rate limit exceeded', retryAfter: Math.ceil((resetAt - Date.now()) / 1000) },
            {
                status: 429,
                headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) },
            }
        );
    }

    // 2. Parse body
    const parsed = await parseStrictJson(req, chatRequestSchema);
    if (!parsed.success) return parsed.response;
    const { message: rawMessage, context, provider, model } = parsed.data;
    if (provider === 'anthropic' && model && !ALLOWED_ANTHROPIC_MODELS.has(model)) {
        return problem(400, 'unsupported_model');
    }
    if (provider === 'google' && model && !ALLOWED_GOOGLE_MODELS.has(model)) {
        return problem(400, 'unsupported_model');
    }
    if (provider === 'ollama' && process.env.NODE_ENV === 'production' && !process.env.OLLAMA_BASE_URL) {
        return problem(400, 'provider_unavailable');
    }

    // ── Pre-process: clean the user input before sending to the AI ────────────
    // Removes PDF artefacts, control chars, duplicate paragraphs, etc.
    // The client already pre-processes, but this is the server-side safety net.
    const { cleaned: message, savedTokens: serverSavedTokens, flags: cleanFlags } = preprocessUserInput(rawMessage);
    if (serverSavedTokens > 0) {
        console.log(`[Preprocessor] Cleaned input: ${rawMessage.length}→${message.length} chars (saved ~${serverSavedTokens} tokens). Flags: ${cleanFlags.join(', ')}`);
    }

    // 3. Payload size guard (DoS protection)
    if (message.length > MESSAGE_MAX_CHARS) {
        return NextResponse.json({ error: 'Message payload too large' }, { status: 413 });
    }

    // 4. Resolve question context.
    //
    // Preferred path:
    //   client sends only questionId, server fetches the full question context.
    //
    // Legacy fallback:
    //   callers without a DB-backed questionId may still send inline question
    //   content so the AI remains usable in demos and older flows.
    let resolvedContext = context;
    const questionId = context.questionId ?? context.question?.id;
    if (questionId) {
        const serverQuestion = await fetchQuestionContextById(questionId);
        if (serverQuestion) {
            resolvedContext = {
                ...context,
                mode: 'guided',
                question: serverQuestion,
            };
        } else if (context.question?.content) {
            resolvedContext = { ...context, mode: 'guided' };
        } else {
            // If the question ID is invalid or unavailable, keep guided mode so the
            // tutor still behaves correctly, but omit the missing question block.
            resolvedContext = { ...context, mode: 'guided' };
        }
    }

    // 4b. Build system prompt
    const systemPrompt = buildSystemPrompt(resolvedContext);

    // 5. Route to the appropriate provider
    try {
        if (provider === 'ollama') {
            const result = await handleOllama(message, resolvedContext, systemPrompt, model);
            return NextResponse.json({ success: true, ...result });
        }

        if (provider === 'google') {
            if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
                return NextResponse.json(
                    { error: 'Gemini API key not configured', details: 'Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local' },
                    { status: 503 },
                );
            }
            const result = await handleGemini(message, resolvedContext, systemPrompt, model);
            return NextResponse.json({ success: true, ...result });
        }

        // Default: Anthropic
        if (!isAnthropicConfigured()) {
            return NextResponse.json(
                { error: 'Anthropic provider not configured' },
                { status: 503 },
            );
        }

        const result = await handleAnthropic(message, resolvedContext, systemPrompt, model, session?.user?.id);
        return NextResponse.json({ success: true, ...result });
    } catch (err: unknown) {
        const error = err as Error;
        console.error('[AI Chat Route] Error:', error.message);

        // Surface Ollama-specific errors as 503 with helpful details
        const isOllamaError =
            provider === 'ollama' &&
            (error.message.includes('ECONNREFUSED') ||
                error.message.includes('fetch failed') ||
                error.message.includes('Ollama'));

        if (isOllamaError) {
            const noModel = error.message.includes('model') || error.message.includes('404');
            return NextResponse.json(
                {
                    error: 'Local AI unavailable',
                    details: noModel
                        ? `All local models failed or unavailable. Check Ollama has at least one model loaded: ollama list`
                        : `Ollama service error: ${error.message}. Make sure Ollama is running (ollama serve).`,
                },
                { status: 503 },
            );
        }

        // Surface Gemini-specific errors with actionable messages
        if (provider === 'google') {
            const msg = error.message;
            if (msg.includes('429') || msg.includes('Too Many Requests') || msg.includes('quota')) {
                const isPro = (model ?? '').includes('pro');
                return NextResponse.json(
                    {
                        error: 'Gemini quota exceeded',
                        details: isPro
                            ? 'Gemini Pro requires a paid Google AI API plan. Please switch to Gemini Flash (free tier) or upgrade your API plan at aistudio.google.com.'
                            : 'Gemini rate limit reached. Please wait a moment and try again.',
                    },
                    { status: 429 },
                );
            }
            if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
                return NextResponse.json(
                    { error: 'Invalid Gemini API key', details: 'The GOOGLE_GENERATIVE_AI_API_KEY in .env.local is invalid. Get a new key at aistudio.google.com.' },
                    { status: 401 },
                );
            }
            if (msg.includes('404') || msg.includes('not found') || msg.includes('models/')) {
                return NextResponse.json(
                    { error: 'Gemini model not found', details: `Model "${model}" is not available on your API plan. Try Gemini Flash instead.` },
                    { status: 404 },
                );
            }
        }

        return NextResponse.json(
            {
                error: 'Internal server error',
                ...(process.env.NODE_ENV === 'production' ? {} : { details: error.message }),
            },
            { status: 500 },
        );
    }
}
