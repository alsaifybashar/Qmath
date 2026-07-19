import { db } from '@/db/drizzle';
import { learningEvents } from '@/db/schema';
import { learningEventSchema, EVENT_VERSIONS, type LearningEvent } from './types';

/**
 * Append a learning event. Server-side only.
 *
 * Telemetry must never break the study flow: validation or insert failures
 * are logged and swallowed, so callers can fire-and-forget without awaiting
 * error handling.
 */
export async function emitLearningEvent(event: LearningEvent): Promise<void> {
    try {
        const parsed = learningEventSchema.parse(event);
        await db.insert(learningEvents).values({
            userId: parsed.userId,
            sessionId: parsed.sessionId ?? null,
            eventType: parsed.eventType,
            eventVersion: EVENT_VERSIONS[parsed.eventType],
            questionId: parsed.questionId ?? null,
            topicId: parsed.topicId ?? null,
            stepId: parsed.stepId ?? null,
            payload: parsed.payload,
        });
    } catch (error) {
        console.error(`[learning-events] failed to emit ${event?.eventType}:`, error);
    }
}
