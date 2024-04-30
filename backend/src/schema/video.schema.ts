import { z } from 'zod';

const publishVideoSchema = z.object({
    videoFile: z.string({ required_error: 'video file url is missing' }).trim(),

    title: z.string({ required_error: 'Title is required' }).trim(),

    thumbnail: z.string({ required_error: 'Thumbnail url is missing' }).trim(),

    description: z.string({
        required_error: 'description about the video is missing',
    }),

    isPublished: z.boolean().optional(),

    owner: z.string({ required_error: "Couldn't fetch owner id" }),

    thumbnailPublicId: z.string(),

    videoPublicId: z.string(),

    duration: z.number({ required_error: 'video duration is required' }),
});

type PublishVideoSchema = z.infer<typeof publishVideoSchema>;

const updateVideoSchema = z.object({
    title: z.string({ required_error: 'Title is required' }).trim(),

    thumbnail: z.string().trim().optional(),

    description: z.string({
        required_error: 'description about the video is missing',
    }),
});

export { publishVideoSchema, type PublishVideoSchema, updateVideoSchema };
