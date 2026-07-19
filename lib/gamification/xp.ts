export const XP_PER_ATTEMPT = 10;
export const XP_PER_LEVEL = 500;

export function xpForAttempts(attemptCount: number): number {
    return Math.max(0, attemptCount) * XP_PER_ATTEMPT;
}

export function levelForXp(xp: number): number {
    return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
}
