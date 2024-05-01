import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { Video } from '../models/video.model';
import { Tweet } from '../models/tweet.model';
import { commentSchema, updateCommentSchema } from '../schema/comment.schema';
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
        const parseRequestBody = commentSchema.safeParse(req.body);
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
        const parseRequestBody = commentSchema.safeParse(req.body);
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

const updateComment = asyncHandler(async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const parseRequestBody = updateCommentSchema.safeParse(req.body);
    if (!parseRequestBody.success) {
        return res.status(400).json({
            message: 'Empty field',
            errors: parseRequestBody.error.errors.map((item) => item.message),
        });
    }

    const commentToBeUpdated = Comment.findById(commentId, parseRequestBody, {
        new: true,
    });
    if (!commentToBeUpdated) {
        throw new ApiError(404, 'Commend to be updated not found');
    }

    res.status(201).json(
        new ApiResponse(200, `Comment created `, { updateComment })
    );
});

const deleteComment = asyncHandler(async (req: Request, res: Response) => {
    const { videoIdOrTweetId } = req.params;

    const existingTweet = await Tweet.findById(videoIdOrTweetId);
    const existingVideo = await Video.findById(videoIdOrTweetId);

    if (!existingTweet && !existingVideo) {
        throw new ApiError(404, 'Neither Tweet exists nor Video ');
    }
    if (existingTweet) {
        await Comment.findByIdAndDelete(existingTweet._id);

        res.status(201).json(new ApiResponse(200, `Comment deleted`, {}));
    }

    if (existingVideo) {
        await Comment.findByIdAndDelete(existingVideo._id);
        res.status(201).json(new ApiResponse(200, `Comment deleted`, {}));
    }
});

const getVideoComments = asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;

    const existingVideo = await Video.findById(videoId).select('_id');

    if (!existingVideo) {
        throw new ApiError(404, `Video doesn't exist`);
    }
    const getAllComments = await Comment.aggregate([
        {
            $match: {
                video: existingVideo._id,
            },
        },
    ]);

    res.status(200).json(
        new ApiResponse(200, 'Fetched the comments of a video ', {
            getAllComments,
        })
    );
});

const getTweetsComments = asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;

    const existingTweet = await Tweet.findById(videoId).select('_id');

    if (!existingTweet) {
        throw new ApiError(404, `Tweet doesn't exist`);
    }
    const getAllComments = await Tweet.aggregate([
        {
            $match: {
                video: existingTweet._id,
            },
        },
    ]);

    res.status(200).json(
        new ApiResponse(200, 'Fetched the comments of a tweet ', {
            getAllComments,
        })
    );
});

export {
    createComment,
    updateComment,
    deleteComment,
    getVideoComments,
    getTweetsComments,
};
