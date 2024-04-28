import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import {
    deleteAssetsFromCloudinary,
    uploadOnCloudinary,
} from '../utils/cloudinary';
import { publishVideoSchema } from '../schema/video.schema';
import { User } from '../models/user.model';
import { Video } from '../models/video.model';
import { ApiResponse } from '../utils/ApiResponse';

const publishAVideo = asyncHandler(async (req: Request, res: Response) => {
    let videoFileLocalPath = '';
    let thumbnailLocalPath = '';
    let videoFileUrl = '';
    let thumbnailUrl = '';

    if (req.files && 'videoFile' in req.files && 'thumbnail' in req.files) {
        //video File validattion
        const video = req.files['videoFile'][0];
        const extVideoFile = video.originalname
            ?.split('.')
            .pop()
            ?.toLowerCase();
        const extArrayVideoFile = ['mp4', 'avif'];
        if (extVideoFile && !extArrayVideoFile.includes(extVideoFile)) {
            throw new ApiError(401, 'File type not supported for the video');
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
            throw new ApiError(401, 'File type not supported for the image');
        }
        if (thumbnail.size > 3.5e6) {
            throw new ApiError(400, 'Image file size is greater than 3.5mb');
        }

        thumbnailLocalPath = thumbnail.path;

        if (thumbnailLocalPath && videoFileLocalPath) {
            const video = await uploadOnCloudinary(videoFileLocalPath);
            req.body.videoFile = video.url;
            console.log(video.duration);
            console.log(video.durations);
            console.log(video);
            console.log();
            if (!video) {
                throw new ApiError(
                    401,
                    "Video file couldn't be uploaded to the cloudinary"
                );
            }
            const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
            req.body.thumbnail = thumbnail.url;

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
                await deleteAssetsFromCloudinary(thumbnail.public_id, 'image');

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
                const checkingSavedVideo = await Video.findById(savedVideo._id);
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
});

export { publishAVideo };
