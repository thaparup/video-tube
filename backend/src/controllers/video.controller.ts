import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import {
    deleteAssetsFromCloudinary,
    uploadOnCloudinary,
} from '../utils/cloudinary';
import { publishVideoSchema, updateVideoSchema } from '../schema/video.schema';
import { User } from '../models/user.model';
import { Video } from '../models/video.model';
import { ApiResponse } from '../utils/ApiResponse';

const publishAVideo = asyncHandler(async (req: Request, res: Response) => {
    let videoFileLocalPath = '';
    let thumbnailLocalPath = '';
    let videoFileUrl = '';
    let thumbnailUrl = '';
    let videoPublicId = '';
    let thumbnailPublicId = '';

    try {
        if (req.files && 'videoFile' in req.files && 'thumbnail' in req.files) {
            //video File validattion
            const video = req.files['videoFile'][0];
            const extVideoFile = video.originalname
                ?.split('.')
                .pop()
                ?.toLowerCase();
            const extArrayVideoFile = ['mp4', 'avif'];
            if (extVideoFile && !extArrayVideoFile.includes(extVideoFile)) {
                throw new ApiError(
                    401,
                    'File type not supported for the video'
                );
            }
            if (video.size > 5e7) {
                throw new ApiError(400, 'Video file size is greater than 50mb');
            }

            videoFileLocalPath = video.path;

            //imaage File validation
            const thumbnail = req.files['thumbnail'][0];
            const ext = thumbnail.originalname?.split('.').pop()?.toLowerCase();
            const arrayOfExt = ['png', 'jpeg', 'jpg'];
            if (ext && !arrayOfExt.includes(ext)) {
                throw new ApiError(
                    401,
                    'File type not supported for the image'
                );
            }
            if (thumbnail.size > 3.5e6) {
                throw new ApiError(
                    400,
                    'Image file size is greater than 3.5mb'
                );
            }

            thumbnailLocalPath = thumbnail.path;

            if (thumbnailLocalPath && videoFileLocalPath) {
                const video = await uploadOnCloudinary(videoFileLocalPath);
                req.body.videoFile = video.url;
                videoPublicId = video.public_id;

                if (!video) {
                    throw new ApiError(
                        401,
                        "Video file couldn't be uploaded to the cloudinary"
                    );
                }
                const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
                req.body.thumbnail = thumbnail.url;
                thumbnailPublicId = thumbnail.public_id;

                if (!thumbnail) {
                    throw new ApiError(
                        401,
                        "Thumbnail couldn't be uploaded to the cloudinary"
                    );
                }

                req.body.owner = req.user?._id.toString();
                req.body.duration = video.duration;
                const parseRequestBody = publishVideoSchema.safeParse(req.body);
                if (!parseRequestBody.success) {
                    await deleteAssetsFromCloudinary(video.public_id, 'video');
                    await deleteAssetsFromCloudinary(
                        thumbnail.public_id,
                        'image'
                    );

                    return res.status(400).json({
                        message: 'Empty field',
                        errors: parseRequestBody.error.errors.map(
                            (item) => item.message
                        ),
                    });
                }

                const newVideo = new Video(parseRequestBody.data);
                const savedVideo = await newVideo.save();

                if (savedVideo) {
                    const checkingSavedVideo = await Video.findById(
                        savedVideo._id
                    );
                    if (!checkingSavedVideo) {
                        new ApiError(
                            500,
                            `Internal Server Error, Couldn't save to db`
                        );
                    }
                    return res
                        .status(201)
                        .json(
                            new ApiResponse(
                                201,
                                'Video uploaded to VideoTube',
                                checkingSavedVideo || {}
                            )
                        );
                }
            } else {
                throw new ApiError(
                    402,
                    'local path video file or thumbnail is missing'
                );
            }
        } else {
            throw new ApiError(402, 'Video File or thumbnail is missing');
        }
    } catch (error) {
        console.error(error);
        await deleteAssetsFromCloudinary(videoPublicId, 'video');
        await deleteAssetsFromCloudinary(thumbnailPublicId, 'image');

        res.status(500).json({ message: 'Server error' });
    }
});

const getVideoById = asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) {
        new ApiError(404, `Video doesn't exist`);
    }
    const contentCreator = await User.findById(video?.owner).select(
        '-password -watchHistory -email -refreshToken'
    );

    const sub = await User.aggregate([
        {
            $match: {
                _id: contentCreator?._id,
            },
        },

        {
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'channel',
                as: 'result',
            },
        },
        {
            $addFields: {
                totalSubscriberOfTheContentCreater: {
                    $size: '$result',
                },
                isViewerSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, '$result.subscriber'] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                avatarImage: 1,
                totalSubscriberOfTheContentCreater: 1,
                isViewerSubscribed: 1,
            },
        },
    ]);

    const subscriptionDetail = sub[0];
    res.status(200).json(
        new ApiResponse(200, 'Video by the id fetched successfully', {
            video,
            subscriptionDetail,
        })
    );
});

const updateVideo = asyncHandler(async (req: Request, res: Response) => {
    let thumbnailLocalPath = '';
    let thumbnailPublicId = '';
    try {
        const { videoId } = req.params;
        const video = await Video.findById(videoId);

        if (req.file) {
            const thumbnail = req.file;
            const ext = thumbnail.originalname?.split('.').pop()?.toLowerCase();
            const arrayOfExt = ['png', 'jpeg', 'jpg'];
            if (ext && !arrayOfExt.includes(ext)) {
                throw new ApiError(
                    401,
                    'File type not supported for the image'
                );
            }
            if (thumbnail.size > 3.5e6) {
                throw new ApiError(
                    400,
                    'Image file size is greater than 3.5mb'
                );
            }

            thumbnailLocalPath = thumbnail.path;
        }

        if (thumbnailLocalPath) {
            const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
            req.body.thumbnail = thumbnail.url;
            thumbnailPublicId = thumbnail.public_id;
            if (!thumbnail) {
                throw new ApiError(
                    401,
                    "Thumbnail couldn't be uploaded to the cloudinary"
                );
            }
        }

        const parseRequestBody = updateVideoSchema.safeParse(req.body);
        if (!parseRequestBody.success) {
            await deleteAssetsFromCloudinary(thumbnailPublicId, 'image');

            return res.status(400).json({
                message: 'Empty field',
                errors: parseRequestBody.error.errors.map(
                    (item) => item.message
                ),
            });
        }
        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            parseRequestBody.data,
            { new: true } // Return the updated document
        );
        res.status(200).json(
            new ApiResponse(202, 'Video details updated', { updatedVideo })
        );
    } catch (error) {
        console.error(error);
        await deleteAssetsFromCloudinary(thumbnailPublicId, 'image');
        res.status(500).json({ message: 'Server error' });
    }
});

const deleteVideo = asyncHandler(async (req: Request, res: Response) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, 'Video not found');
    }

    if (video.thumbnailPublicId) {
        await deleteAssetsFromCloudinary(video.thumbnailPublicId, 'image');
    }

    if (video.videoPublicId) {
        await deleteAssetsFromCloudinary(video.videoPublicId, 'video');
    }

    await Video.findByIdAndDelete(videoId);
    res.status(200).json(
        new ApiResponse(202, 'Video deleted successfully ', {})
    );
});

const togglePublishStatus = asyncHandler(
    async (req: Request, res: Response) => {
        const { videoId } = req.params;

        const videoToBeUpdated =
            await Video.findByIdAndUpdate(videoId).select('isPublished');
        console.log(videoToBeUpdated);
        if (!videoToBeUpdated) {
            throw new ApiError(404, 'Video not found');
        }
        videoToBeUpdated.isPublished = !videoToBeUpdated.isPublished;
        await videoToBeUpdated.save({ validateBeforeSave: false });
        res.status(200).json(
            new ApiResponse(200, 'Toggled Publish Status', { videoToBeUpdated })
        );
    }
);

export {
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
