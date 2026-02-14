
'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { db } from '@/db/drizzle';
import { users, profiles, universities } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { SignupFormSchema } from '@/app/lib/definitions';
import { redirect } from 'next/navigation';

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

export async function register(prevState: any, formData: FormData) {
    const validateFields = SignupFormSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        university: formData.get('university'),
        yearOfStudy: formData.get('yearOfStudy'),
        program: formData.get('program'),
    });

    if (!validateFields.success) {
        return {
            errors: validateFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Register.',
        };
    }

    const { name, email, password, university, yearOfStudy, program } = validateFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        if (existingUser) {
            return {
                message: 'Email already in use.',
            };
        }

        const [newUser] = await db.insert(users).values({
            name,
            email,
            password: hashedPassword,
            role: 'student',
        }).returning();

        // Find or create university
        let universityId = null;
        if (university) {
            const uni = await db.query.universities.findFirst({
                where: eq(universities.name, university)
            });

            if (uni) {
                universityId = uni.id;
            } else {
                // If university doesn't exist (e.g. database not seeded), create it
                // Default country to Sweden as the frontend list is Swedish universities
                const [newUni] = await db.insert(universities).values({
                    name: university,
                    country: 'Sweden'
                }).returning();
                universityId = newUni.id;
            }
        }

        // Create profile
        await db.insert(profiles).values({
            id: newUser.id,
            universityId: universityId,
            studyYear: yearOfStudy,
            universityProgram: program,
        });

    } catch (error) {
        return {
            message: 'Database Error: Failed to Create User.',
        };
    }

    // Auto-login and redirect to course selection
    await signIn('credentials', {
        email,
        password,
        redirectTo: '/onboarding/courses',
    });
}

export async function forgotPassword(prevState: any, formData: FormData) {
    const email = formData.get('email');

    // 1. Validate email
    if (!email || typeof email !== 'string') {
        return { error: 'Invalid email address.' };
    }

    // 2. Check if user exists (optional, depending on security vs UX)
    // For security, often we don't reveal if a user exists, but for UX we might.
    // We will just return success message regardless to prevent enumeration.

    // 3. TODO: Generate token and send email
    console.log(`[STUB] Sending password reset email to: ${email}`);

    return { message: 'If an account exists with this email, a reset link has been sent.' };
}

export async function checkEmailAvailability(email: string) {
    if (!email) return false;

    try {
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        return !existingUser;
    } catch (error) {
        console.error('Failed to check email availability:', error);
        return false; // Fail safe, assume unavailable or error
    }
}
