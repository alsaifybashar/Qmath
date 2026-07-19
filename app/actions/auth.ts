
'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { db } from '@/db/drizzle';
import { users, profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SignupFormSchema } from '@/app/lib/definitions';
import { hashPassword, normalizeEmail } from '@/lib/security/password';
import { checkRateLimit } from '@/lib/rate-limit';
import { emitSecurityEvent } from '@/lib/security/events';
import { z } from 'zod';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        const email = formData.get('email');
        const password = formData.get('password');
        await signIn('credentials', {
            email: typeof email === 'string' ? email : '',
            password: typeof password === 'string' ? password : '',
            redirectTo: '/dashboard',
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function register(prevState: unknown, formData: FormData) {
    const validateFields = SignupFormSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
    });

    if (!validateFields.success) {
        const fieldErrors = validateFields.error.flatten().fieldErrors;
        const firstError = Object.values(fieldErrors).flat().find(Boolean);
        return {
            errors: fieldErrors,
            message: typeof firstError === 'string' ? firstError : 'Missing Fields. Failed to Register.',
        };
    }

    const { name, email, password } = validateFields.data;
    const registrationLimit = await checkRateLimit(email, 'registration');
    if (!registrationLimit.allowed) {
        return { message: 'Unable to create an account with the provided details.' };
    }

    const hashedPassword = await hashPassword(password);

    try {
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        if (existingUser) return { message: 'Unable to create an account with the provided details.' };

        const [newUser] = await db.insert(users).values({
            name,
            email,
            password: hashedPassword,
            role: 'student',
        }).returning();

        // Create empty profile — filled in during onboarding
        await db.insert(profiles).values({ id: newUser.id });

        emitSecurityEvent({
            category: 'authentication',
            action: 'account.register',
            outcome: 'success',
            actorId: newUser.id,
            actorRole: 'student',
        });
    } catch {
        return { message: 'Unable to create an account with the provided details.' };
    }

    // Auto-login and redirect to onboarding
    await signIn('credentials', {
        email,
        password,
        redirectTo: '/onboarding/welcome',
    });
}

export async function forgotPassword(prevState: unknown, formData: FormData) {
    const parsed = z.string().email().max(254).safeParse(formData.get('email'));
    if (!parsed.success) return { error: 'Invalid email address.' };

    const email = normalizeEmail(parsed.data);
    const limit = await checkRateLimit(email, 'password-reset');
    if (limit.allowed) {
        emitSecurityEvent({
            category: 'authentication',
            action: 'password_reset.request',
            outcome: 'success',
        });
        // Delivery is intentionally delegated to the configured identity/email
        // provider. Never log the address or a reset token here.
    }

    return { message: 'If an account exists with this email, a reset link has been sent.' };
}
