import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { Video } from '../models/video.model';
import { Tweet } from '../models/tweet.model';
import { commentVideoSchema } from '../schema/comment.schema';
import { ApiResponse } from '../utils/ApiResponse';
import { Comment } from '../models/comment.model';
import { ApiError } from '../utils/ApiError';

const createComment = asyncHandler(async (req: Request, res: Response) => {
    const { videoIdOrTweetId } = req.params;

    const existingTweet = await Tweet.findById(videoIdOrTweetId);
    const existingVideo = await Video.findById(videoIdOrTweetId);

    if (!existingTweet && !existingVideo) {
        throw new ApiError(404, 'Neither Tweet exists nor Video ');
    }
    if (existingTweet) {
        req.body.tweet = existingTweet._id;
        const parseRequestBody = commentVideoSchema.safeParse(req.body);
        if (!parseRequestBody.success) {
            return res.status(400).json({
                message: 'Empty field',
                errors: parseRequestBody.error.errors.map(
                    (item) => item.message
                ),
            });
        }
        const newComment = new Comment(parseRequestBody.data);
        const savedComment = await newComment.save();

        res.status(201).json(
            new ApiResponse(200, `Comment created `, { savedComment })
        );
    }

    if (existingVideo) {
        req.body.video = existingVideo._id.toString();
        const parseRequestBody = commentVideoSchema.safeParse(req.body);
        if (!parseRequestBody.success) {
            return res.status(400).json({
                message: 'Empty field',
                errors: parseRequestBody.error.errors.map(
                    (item) => item.message
                ),
            });
        }
        const newComment = new Comment(parseRequestBody.data);
        const savedComment = await newComment.save();
        console.log(savedComment);
        res.status(201).json(
            new ApiResponse(200, `Comment created `, savedComment)
        );
    }
});
export { createComment };
