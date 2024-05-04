import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { Video } from '../models/video.model';
import { ApiError } from '../utils/ApiError';
import { Like } from '../models/like.model';
import { ApiResponse } from '../utils/ApiResponse';
import { Tweet } from '../models/tweet.model';
import mongoose from 'mongoose';
import { Comment } from '../models/comment.model';
import { equal } from 'assert';

const toggleVideoLike = asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;

    const existingVideo = await Video.findById(videoId).select('_id');

    if (!existingVideo) {
        throw new ApiError(404, `Video doesn't exist`);
    }

    const findAllTheLikesOnTheVideo = await Like.find({
        video: existingVideo._id,
    }).select('likedBy -_id');

    const ifUserHasAlreadyLikedTheVideo = await Like.aggregate([
        {
            $project: {
                hasLiked: {
                    $cond: {
                        if: {
                            $in: [
                                req.user?._id,
                                findAllTheLikesOnTheVideo.map(
                                    (ele) => ele.likedBy
                                ),
                            ],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
    ]);

    if (ifUserHasAlreadyLikedTheVideo.length > 0) {
        await Like.findByIdAndDelete(ifUserHasAlreadyLikedTheVideo[0]._id);
        res.status(200).json(
            new ApiResponse(200, `User's like has been removed`, {})
        );
    } else {
        const createLike = await Like.create({
            video: existingVideo._id,
            likedBy: req.user?.id,
        });

        res.status(201).json(
            new ApiResponse(200, 'User hasliked a Video', {
                createLike,
            })
        );
    }
});

const toggleTweetLike = asyncHandler(async (req: Request, res: Response) => {
    const { tweetId } = req.params;

    const existingTweet = await Tweet.findById(tweetId).select('_id');

    if (!existingTweet) {
        throw new ApiError(404, `Tweet doesn't exist`);
    }

    const findAllTheLikesOnTheTweet = await Like.find({
        tweet: tweetId,
    }).select('likedBy -_id');

    const ifUserHasAlreadyLikedTheTweet = await Like.aggregate([
        {
            $project: {
                hasLiked: {
                    $cond: {
                        if: {
                            $in: [
                                req.user?._id,
                                findAllTheLikesOnTheTweet.map(
                                    (ele) => ele.likedBy
                                ),
                            ],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
    ]);

    if (ifUserHasAlreadyLikedTheTweet.length > 0) {
        console.log(ifUserHasAlreadyLikedTheTweet);
        console.log('first');
        await Like.findByIdAndDelete(ifUserHasAlreadyLikedTheTweet[0]._id);
        res.status(200).json(
            new ApiResponse(200, `User's like has been removed`, {})
        );
    } else {
        const createLike = await Like.create({
            tweet: existingTweet._id,
            likedBy: req.user?.id,
        });

        res.status(201).json(
            new ApiResponse(200, 'User hasliked a Tweet', {
                createLike,
            })
        );
    }
});

const toggleCommentLike = asyncHandler(async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const existingComment = await Comment.findById(commentId).select('_id');
    if (!existingComment) {
        throw new ApiError(404, `Comment doesn't exist`);
    }
    const findAllTheLikesOnTheComment = await Like.find({
        comment: commentId,
    }).select('-createdAt -updatedAt');
    if (findAllTheLikesOnTheComment.length == 0) {
        const createLike = await Like.create({
            comment: existingComment._id,
            likedBy: req.user?.id,
        });
        return res.status(201).json(
            new ApiResponse(200, 'User hasliked a Tweet', {
                createLike,
            })
        );
    }

    if (findAllTheLikesOnTheComment.length > 0) {
        const ifUserHasAlreadyLikedTheComment =
            findAllTheLikesOnTheComment.find((ele) =>
                ele.likedBy?.equals(new mongoose.Types.ObjectId(req.user?._id))
            );
        if (!ifUserHasAlreadyLikedTheComment) {
            const createLike = await Like.create({
                comment: existingComment._id,
                likedBy: req.user?.id,
            });
            return res.status(201).json(
                new ApiResponse(200, 'User hasliked a Tweet', {
                    createLike,
                })
            );
        } else {
            await Like.findByIdAndDelete(ifUserHasAlreadyLikedTheComment._id);
            res.status(200).json(
                new ApiResponse(200, `User's like has been removed`, {})
            );
        }
    }
    // const ifUserHasAlreadyLikedTheComment = await Like.aggregate([
    //     {
    //         $project: {
    //             hasLiked: {
    //                 $cond: {
    //                     if: {
    //                         $in: [
    //                             req.user?._id,
    //                             findAllTheLikesOnTheComment.map(
    //                                 (ele) => ele.likedBy
    //                             ),
    //                         ],
    //                     },
    //                     then: true,
    //                     else: false,
    //                 },
    //             },
    //         },
    //     },
    // ]);
    // if (ifUserHasAlreadyLikedTheComment.length > 0) {
    //     console.log(ifUserHasAlreadyLikedTheComment);
    //     console.log('first');
    //     await Like.findByIdAndDelete(ifUserHasAlreadyLikedTheComment[0]._id);
    //     res.status(200).json(
    //         new ApiResponse(200, `User's like has been removed`, {})
    //     );
    // } else {
    //     const createLike = await Like.create({
    //         comment: existingComment._id,
    //         likedBy: req.user?.id,
    //     });
    //     res.status(201).json(
    //         new ApiResponse(200, 'User hasliked a Tweet', {
    //             createLike,
    //         })
    //     );
    // }
});

const getLikedVideos = asyncHandler(async (req: Request, res: Response) => {
    const getAllVideosLikedByTheUser = await Like.find({
        likedBy: req.user?._id,
        video: { $exists: true },
    });

    res.status(201).json(
        new ApiResponse(200, 'Vides liked by the user', {
            getAllVideosLikedByTheUser,
        })
    );
});

export { toggleVideoLike, toggleTweetLike, toggleCommentLike, getLikedVideos };
