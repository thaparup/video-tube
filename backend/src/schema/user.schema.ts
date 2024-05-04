import { z } from 'zod';

const registerUserSchema = z
    .object({
        username: z
            .string({ required_error: 'username is required' })
            .trim()
            .toLowerCase(),
        email: z
            .string({ required_error: 'Email is required' })
            .email({ message: 'Invalid email address' }),
        fullName: z.string({ required_error: 'Full name is required' }),
        avatarImage: z.string({ required_error: 'Avatar image is required' }),
        coverImage: z.string().url().optional(),
        password: z
            .string({ required_error: 'Password is required' })
            .min(5, { message: 'Must be 5 or more characters long' }),
        confirmPassword: z.string({
            required_error: 'confirmation password is required',
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Password do not match',
        path: ['password', 'confirmPassword'],
    });

const updateUserSchema = z.object({
    fullName: z.string({ required_error: 'Full Name is required' }),

    email: z.string({ required_error: 'Email is required' }).email(),

    coverImage: z.string().optional(),

    avatarImage: z.string().optional(),
});

export { registerUserSchema, updateUserSchema };
