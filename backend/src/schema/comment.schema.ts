import { string, z } from 'zod';

const commentSchema = z.object({
    content: string({ required_error: 'Comment cannot be empty ' }).max(1000),
    video: string().optional(),
    tweet: string().optional(),
});

const updateCommentSchema = z.object({
    content: string({ required_error: 'Comment cannot be empty ' }).max(1000),
});

export { commentSchema, updateCommentSchema };
