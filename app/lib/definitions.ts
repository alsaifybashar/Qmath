
import { z } from 'zod';
import { normalizeEmail, validateNewPassword } from '@/lib/security/password';

export const SignupFormSchema = z.object({
    name: z.string().trim().min(2, { message: 'Name must be at least 2 characters long.' }).max(100),
    email: z.string().email({ message: 'Please enter a valid email.' }).max(254).transform(normalizeEmail),
    password: z.string().min(15, { message: 'Use at least 15 characters.' }).max(128),
}).strict().superRefine((value, context) => {
    const passwordError = validateNewPassword(value.password, value.email);
    if (passwordError) {
        context.addIssue({ code: 'custom', path: ['password'], message: passwordError });
    }
});

export const LoginFormSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email.' }).max(254).transform(normalizeEmail),
    password: z.string().min(1, { message: 'Password field must not be empty.' }).max(128),
}).strict();
