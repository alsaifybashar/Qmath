
import { z } from 'zod';

export const SignupFormSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters long.' }),
    email: z.string().email({ message: 'Please enter a valid email.' }),
    password: z.string().min(6, { message: 'Be at least 6 characters long.' }),
    university: z.string().min(1, { message: 'Please select a university.' }),
    yearOfStudy: z.coerce.number().min(1, { message: 'Please select your year of study.' }).max(10, { message: 'Year of study cannot exceed 10.' }),
    program: z.string().min(2, { message: 'Please enter your program.' }).max(100, { message: 'Program name is too long.' }),
});

export const LoginFormSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email.' }),
    password: z.string().min(1, { message: 'Password field must not be empty.' }),
});
