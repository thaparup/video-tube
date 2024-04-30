import { string, z } from 'zod';

const commentVideoSchema = z.object({
    content: string({ required_error: 'Comment cannot be empty ' }).max(1000),
    video: string().optional(),
    tweet: string().optional(),
});

export { commentVideoSchema };
