import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { createTweetSchema } from '../schema/tweet.schema';
import { Tweet } from '../models/tweet.model';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

const createTweet = asyncHandler(async (req: Request, res: Response) => {
    req.body.owner = req.user?._id;
    const parseRequestBody = createTweetSchema.safeParse(req.body);
    if (!parseRequestBody.success) {
        return res.status(400).json({
            message: 'Empty field',
            errors: parseRequestBody.error.errors.map((item) => item.message),
        });
    }
    const newTweet = new Tweet(parseRequestBody.data);
    const savedTweet = await newTweet.save();
    res.status(201).json(
        new ApiResponse(200, 'Tweet Created ', { savedTweet })
    );
});

const getUserTweets = asyncHandler(async (req: Request, res: Response) => {
    const allTweetsOfTheUser = await Tweet.find({ owner: req.user?._id });

    res.status(200).json(
        new ApiResponse(200, 'Users Tweet ', { allTweetsOfTheUser })
    );
});

const updateTweet = asyncHandler(async (req: Request, res: Response) => {
    const { tweetId } = req.params;

    const ifTweetExist = await Tweet.findById(tweetId);

    if (!ifTweetExist) {
        throw new ApiError(404, 'Tweet not found');
    }

    req.body.owner = req.user?._id;
    const parseRequestBody = createTweetSchema.safeParse(req.body);
    if (!parseRequestBody.success) {
        return res.status(400).json({
            message: 'Empty field',
            errors: parseRequestBody.error.errors.map((item) => item.message),
        });
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        parseRequestBody,
        { new: true }
    );

    res.status(200).json(
        new ApiResponse(200, 'Tweet updated ', { updatedTweet })
    );
});

const deleteTweet = asyncHandler(async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const existingComment = await Tweet.findByIdAndDelete(commentId);
    if (!existingComment) {
        throw new ApiError(404, 'Tweet not found');
    }

    res.status(200).json(
        new ApiResponse(200, 'Tweet deleted succuessfully', {})
    );
});
export { createTweet, getUserTweets, updateTweet, deleteTweet };
