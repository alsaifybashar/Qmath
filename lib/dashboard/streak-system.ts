import { db } from '@/db/drizzle';
import { userStreaks } from '@/db/dashboard-schema';
import { eq } from 'drizzle-orm';

export async function checkAndMaintainStreak(userId: string) {
    const streakRecord = await db.query.userStreaks.findFirst({
        where: eq(userStreaks.userId, userId),
    });

    if (!streakRecord) return null;

    const now = new Date();
    const lastStudyDate = streakRecord.lastStudyDate ? new Date(streakRecord.lastStudyDate) : null;

    if (!lastStudyDate) return streakRecord;

    // Normalize dates to midnight to compare days
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const lastDate = new Date(lastStudyDate);
    lastDate.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // If more than 1 day has passed (missed yesterday)
    // Example: Last study Monday. Today is Wednesday. Diff = 2 days. Missed Tuesday.
    if (diffDays > 1) {
        // Calculate missing days
        const missedDays = diffDays - 1;

        if (streakRecord.freezeDaysAvailable >= missedDays) {
            // Use freeze days to protect streak
            console.log(`User ${userId} used ${missedDays} freeze days to protect streak.`);

            await db.update(userStreaks)
                .set({
                    freezeDaysAvailable: streakRecord.freezeDaysAvailable - missedDays,
                    freezeDaysUsed: (streakRecord.freezeDaysUsed || 0) + missedDays,
                    lastStudyDate: new Date(today.getTime() - (24 * 60 * 60 * 1000)), // Set to "yesterday" effectively to bridge the gap? 
                    // Actually, usually we just don't reset the streak. 
                    // But if we don't update lastStudyDate, the next check will still see a gap.
                    // So we should effectively "fill in" the missing days if we consume freeze days.
                    // Or we just update freeze days and let the "increment" logic handle the next activity.
                    // Let's just update freeze days for now. 
                    // Wait, if I don't update lastStudyDate, tomorrow it will be 3 days diff.
                    // So "using a freeze day" effectively counts as a "study day" for continuity purposes?
                    // Typically yes. It "freezes" the streak meaning it doesn't reset.
                    // Let's assume we update only freeze counts and let the streak stay.
                    // But to prevent "double penalty", we should probably update `lastStudyDate` to yesterday so the gap is closed?
                    // No, that manipulates history.
                    // Let's logic: if (diff > 1) AND (freeze >= missed) -> Don't reset. Consume freeze.
                    // We need to persist this consumption so we don't consume it AGAIN next refresh.
                    // So we must update the record.
                })
                .where(eq(userStreaks.userId, userId));

            return { ...streakRecord, freezeDaysAvailable: streakRecord.freezeDaysAvailable - missedDays };
        } else {
            // Streak broken
            console.log(`User ${userId} broke streak. Resetting to 0.`);
            await db.update(userStreaks)
                .set({
                    currentStreak: 0,
                    // Do not reset freeze days (they refresh monthly usually)
                })
                .where(eq(userStreaks.userId, userId));

            return { ...streakRecord, currentStreak: 0 };
        }
    }

    return streakRecord;
}
