import { describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import {
    hashPassword,
    normalizeEmail,
    validateNewPassword,
    verifyPassword,
} from '@/lib/security/password';
import { compileSafeExpression } from '@/lib/math/safe-expression';

describe('password security', () => {
    it('stores and verifies passwords with Argon2id', async () => {
        const hash = await hashPassword('a secure university passphrase');
        expect(hash.startsWith('$argon2id$')).toBe(true);
        expect((await verifyPassword(hash, 'a secure university passphrase')).valid).toBe(true);
        expect((await verifyPassword(hash, 'a different passphrase')).valid).toBe(false);
    });

    it('marks legacy bcrypt hashes for transparent migration', async () => {
        const hash = await bcrypt.hash('legacy password value', 10);
        expect(await verifyPassword(hash, 'legacy password value')).toEqual({
            valid: true,
            needsRehash: true,
        });
    });

    it('enforces length and contextual blocklisting', () => {
        expect(validateNewPassword('short')).toContain('15');
        expect(validateNewPassword('student-account-passphrase', 'student@example.edu')).not.toBeNull();
        expect(validateNewPassword('violet orbit bridge theorem')).toBeNull();
    });

    it('normalizes only the domain portion of email addresses', () => {
        expect(normalizeEmail(' Student.Name@EXAMPLE.EDU ')).toBe('student.name@example.edu');
    });
});

describe('safe math expression compiler', () => {
    it('evaluates allowlisted mathematical expressions', () => {
        const expression = compileSafeExpression('sin(x) + x^2', { symbols: ['x'] });
        expect(expression.evaluate({ x: 2 })).toBeCloseTo(Math.sin(2) + 4);
    });

    it.each([
        'x = 7',
        'f(x) = x + 1',
        'import("fs")',
        'x.constructor',
        '[1, 2, 3]',
        'evil(x)',
    ])('rejects executable or non-allowlisted syntax: %s', (expression) => {
        expect(() => compileSafeExpression(expression, { symbols: ['x'] })).toThrow();
    });

    it('rejects expressions that exceed complexity limits', () => {
        expect(() => compileSafeExpression('1+1+1+1+1+1', { maxNodes: 3 })).toThrow();
    });
});
