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
}

// Build AI System Prompt
function buildAISystemPrompt(context: AIContext): string {
    const topicInfo = context.question?.topic ? `helping a student with ${context.question.topic}` : 'helping a student learn mathematics';

    let prompt = `You are a helpful, encouraging math tutor ${topicInfo}.

IMPORTANT GUIDELINES:
- Use the Socratic method: ask guiding questions instead of giving direct answers
- Be encouraging and supportive, never condescending
- Keep responses concise (2-3 sentences usually)
- If the student is really stuck (3+ attempts), you may give more direct hints
- NEVER directly reveal the answer unless explicitly asked and the student has really tried`;

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
- Recent performance: ${context.student.recentPerformance}

RESPONSE STYLE:
- Be warm and supportive
- Use simple language
- Ask one question at a time
- Celebrate small wins`;

    return prompt;
}

// Mock AI Response Generator (for demo - replace with actual API call in production)
function generateMockAIResponse(message: string, context: AIContext): string {
    const msgLower = message.toLowerCase();
    const attempts = context.attempts?.count || 0;

    // If student says they don't know where to start
    if (msgLower.includes("don't know") || msgLower.includes("start") || msgLower.includes("help")) {
        if (attempts < 2) {
            return "Let's break this down together! 🤔\n\nLook at the problem - what type of mathematical operation or concept do you think applies here? Take your time and tell me your first thought.";
        } else {
            return "I can see you're working hard on this! Let me give you a nudge:\n\nLook at the structure of the expression. What mathematical rules or formulas have you learned that might apply to this type of problem?";
        }
    }

    // If asking about formulas or rules
    if (msgLower.includes("formula") || msgLower.includes("rule") || msgLower.includes("method")) {
        return "Great question! Knowing which formula to use is half the battle. 📚\n\nHint: Check the 'Quick Reference' panel on the right side - I've highlighted the relevant formulas there. Which one do you think matches what we're trying to do?";
    }

    // If asking for explanation
    if (msgLower.includes("explain") || msgLower.includes("how") || msgLower.includes("why")) {
        return "I'd love to explain! Let's think about it step by step:\n\n" +
            (context.question?.topic ?
                `In ${context.question.topic}, we're essentially asking: how does the output change when the input changes? ` :
                "The key concept here is understanding the relationship between the parts. ") +
            "\n\nWhat part of this concept would you like me to clarify first?";
    }

    // If student seems stuck
    if (msgLower.includes("stuck") || msgLower.includes("confused") || msgLower.includes("lost")) {
        if (attempts >= 3) {
            return "I can see you've been working really hard on this! 💪\n\nLet me give you a more direct hint: Try breaking the problem into smaller pieces. What if you handled each term separately?\n\nWould you like me to show you a similar worked example?";
        }
        return "That's okay - getting stuck is part of learning! Let's approach this differently.\n\nInstead of solving the whole problem, let's focus on just the first part. Can you identify what the first step would be?";
    }

    // If giving an answer/attempt
    if (msgLower.includes("is it") || msgLower.includes("my answer") || msgLower.includes("i got") || msgLower.includes("i think")) {
        return "Interesting approach! 🤔\n\nBefore I confirm, let's make sure your reasoning is solid: Can you walk me through how you got that answer? Understanding the 'why' is more important than the 'what'.";
    }

    // Default thoughtful response
    return "That's a thoughtful question! 💡\n\nTo help guide you, think about what we know from the problem and what we're trying to find. Sometimes restating the problem in your own words can help clarify the path forward.\n\nWhat aspect would you like to explore next?";
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, context } = body as {
            message: string;
            context: AIContext
        };

        if (!message || !context) {
            return NextResponse.json(
                { error: 'Message and context are required' },
                { status: 400 }
            );
        }

        // In production, you would:
        // 1. Build the system prompt
        // 2. Call OpenAI/Anthropic API with streaming
        // 3. Return the streamed response

        // For now, use mock response
        const systemPrompt = buildAISystemPrompt(context);
        const response = generateMockAIResponse(message, context);

        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 500));

        return NextResponse.json({
            success: true,
            response: response,
            systemPromptUsed: systemPrompt, // For debugging - remove in production
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
