// Server-safe data processing utilities for dashboard
// This file can be imported in both server and client components

export interface DailyAttempt {
    date: Date;
    total: number;
    correct: number;
}

/**
 * Process raw attempts into daily aggregated data.
 * Groups attempts by date and calculates totals and correct counts.
 */
export function processAttemptsToDaily(
    attempts: Array<{ timestamp?: Date | null; isCorrect?: boolean | null }>
): DailyAttempt[] {
    const dailyMap = new Map<string, { total: number; correct: number }>();

    attempts.forEach(attempt => {
        if (!attempt.timestamp) return;

        const dateKey = new Date(attempt.timestamp).toDateString();
        const existing = dailyMap.get(dateKey) || { total: 0, correct: 0 };
        existing.total++;
        if (attempt.isCorrect) existing.correct++;
        dailyMap.set(dateKey, existing);
    });

    return Array.from(dailyMap.entries()).map(([dateStr, data]) => ({
        date: new Date(dateStr),
        total: data.total,
        correct: data.correct,
    }));
}
