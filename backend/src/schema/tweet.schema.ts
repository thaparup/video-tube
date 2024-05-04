import mongoose from 'mongoose';
import { z } from 'zod';

interface ids {
    owneer: mongoose.Schema.Types.ObjectId;
}
const createTweetSchema = z.object({
    content: z.string({ required_error: 'Tweet content is missing' }).max(1000),

    owner: z.custom((val) => {
        if (!(val instanceof mongoose.Types.ObjectId)) {
            throw new Error('Either object Id is missing or Invalid ObjectId');
        }
        return val;
    }),
});

export { createTweetSchema };
