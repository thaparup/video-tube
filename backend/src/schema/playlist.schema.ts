import mongoose from 'mongoose';
import { z } from 'zod';

const createPlaylistSchema = z.object({
    name: z.string({ required_error: 'Playlist name is required' }),

    description: z.string({ required_error: 'description is required' }),

    videos: z.array(z.unknown()).default([]),

    owner: z.custom((val: any) => {
        if (!(val instanceof mongoose.Types.ObjectId)) {
            throw new Error('Invalid ObjectId');
        }
        return val;
    }),
});

export { createPlaylistSchema };
