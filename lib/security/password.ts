import argon2 from 'argon2';
import bcrypt from 'bcryptjs';

const ARGON2_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 65_536,
    timeCost: 3,
    parallelism: 1,
    hashLength: 32,
} as const;

const COMMON_PASSWORDS = new Set([
    'password',
    'password123',
    'qwertyuiop',
    'letmein',
    '123456789012345',
    'correcthorsebatterystaple',
]);

let dummyHashPromise: Promise<string> | undefined;

export async function hashPassword(password: string): Promise<string> {
    return argon2.hash(password.normalize('NFC'), ARGON2_OPTIONS);
}

export async function verifyPassword(
    storedHash: string,
    password: string,
): Promise<{ valid: boolean; needsRehash: boolean }> {
    const normalized = password.normalize('NFC');

    try {
        if (storedHash.startsWith('$argon2id$')) {
            const valid = await argon2.verify(storedHash, normalized);
            return {
                valid,
                needsRehash: valid && argon2.needsRehash(storedHash, ARGON2_OPTIONS),
            };
        }

        if (storedHash.startsWith('$2')) {
            const valid = await bcrypt.compare(normalized, storedHash);
            return { valid, needsRehash: valid };
        }
    } catch {
        // Invalid or corrupted hashes fail authentication without exposing details.
    }

    return { valid: false, needsRehash: false };
}

export async function consumeEquivalentPasswordCost(password: string): Promise<void> {
    dummyHashPromise ??= hashPassword('qmath-dummy-password-not-used-for-login');
    await verifyPassword(await dummyHashPromise, password);
}

export function validateNewPassword(password: string, email?: string): string | null {
    const normalized = password.normalize('NFC');
    if (normalized.length < 15) return 'Password must contain at least 15 characters.';
    if (normalized.length > 128) return 'Password must contain at most 128 characters.';

    const lower = normalized.toLocaleLowerCase('en-US');
    const localPart = email?.split('@')[0]?.toLocaleLowerCase('en-US');
    if (COMMON_PASSWORDS.has(lower) || (localPart && lower.includes(localPart))) {
        return 'Choose a password that is not common or derived from your email address.';
    }
    return null;
}

export function normalizeEmail(email: string): string {
    return email.trim().normalize('NFC').toLocaleLowerCase('en-US');
}
