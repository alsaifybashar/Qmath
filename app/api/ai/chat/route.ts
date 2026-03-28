import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/auth';
import {
    SOCRATIC_SYSTEM_PROMPT,
    EXPLORER_SYSTEM_PROMPT,
    getMathValidationTool,
    getPlotTool,
    getVisualWidgetTool,
} from '@/lib/ai/prompts/socratic';
import { callOllama, OllamaMessage } from '@/lib/ollama';
import { checkRateLimit } from '@/lib/rate-limit';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MESSAGE_MAX_CHARS = 2000;
const HISTORY_MAX_MESSAGES = 20;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface StudentContext {
    currentPage: string;
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
        recentPerformance: string;
    };
    conversationHistory?: ChatMessage[];
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
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const math = require('mathjs');
        const scope = { x: Math.PI / 7, n: 5, t: 1.2 };
        const sv = math.evaluate(studentExpr.replace(/\^/g, '**'), scope);
        const ev = math.evaluate(expectedExpr.replace(/\^/g, '**'), scope);
        return Math.abs(sv - ev) < 1e-6;
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
) {
    const tools: Anthropic.Tool[] = [
        getMathValidationTool() as Anthropic.Tool,
        getPlotTool() as Anthropic.Tool,
        getVisualWidgetTool('anthropic') as Anthropic.Tool,
    ];

    const messages = buildMessages(userMessage, context.conversationHistory ?? []);

    let response = await anthropic.messages.create({
        model,
        max_tokens: 2000,
        system: systemPrompt,
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
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1500,
            system: systemPrompt,
            tools,
            messages,
        });
    }

    // Extract the final text response
    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    const assistantText = textBlock?.text ?? '';

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

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    // 1. Auth check
    const session = await auth();
    const referer = req.headers.get('referer') || '';
    const isTestPanel = referer.includes('/test-ai-panel') || process.env.NODE_ENV === 'development';
    
    if (!session?.user && !isTestPanel) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1b. Rate limit check
    const rateLimitKey = session?.user?.id ?? req.headers.get('x-forwarded-for') ?? 'anonymous';
    const { allowed, resetAt } = checkRateLimit(rateLimitKey);
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
    let body: { message: string; context: StudentContext; provider?: string; model?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { message, context, provider = 'anthropic', model } = body;

    if (!message || typeof message !== 'string') {
        return NextResponse.json({ error: 'Missing or invalid message' }, { status: 400 });
    }

    // 3. Payload size guard (DoS protection)
    if (message.length > MESSAGE_MAX_CHARS) {
        return NextResponse.json({ error: 'Message payload too large' }, { status: 413 });
    }

    // 4. Build system prompt
    const systemPrompt = buildSystemPrompt(context);

    // 5. Route to the appropriate provider
    try {
        if (provider === 'ollama') {
            const result = await handleOllama(message, context, systemPrompt, model);
            return NextResponse.json({ success: true, ...result });
        }

        // Default: Anthropic
        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json(
                { error: 'Anthropic API key not configured', details: 'Add ANTHROPIC_API_KEY to .env.local' },
                { status: 503 },
            );
        }

        const result = await handleAnthropic(message, context, systemPrompt, model);
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

        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 },
        );
    }
}
