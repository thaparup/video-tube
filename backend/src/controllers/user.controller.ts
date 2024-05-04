import type { Request, Response } from 'express';
import { User } from '../models/user.model';
import { registerUserSchema, updateUserSchema } from '../schema/user.schema';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import {
    deleteAssetsFromCloudinary,
    uploadOnCloudinary,
} from '../utils/cloudinary';
import { Subscription } from '../models/subscription.model';

const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const { username, email } = req.body;
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, 'User with email or username already exists');
    }

    if (req.files && 'avatarImage' in req.files) {
        const avatarLocalPath = req.files['avatarImage'][0].path;

        try {
            const avatarImageUrl = await uploadOnCloudinary(avatarLocalPath);

            if (!avatarImageUrl) {
                throw new ApiError(
                    401,
                    "Avatar image couldn't be uploaded to the cloudinary"
                );
            }
            req.body.avatarImage = avatarImageUrl;
            if ('coverImage' in req.files) {
                const coverLocalPath = req.files['coverImage'][0].path;
                const coverImageUrl = await uploadOnCloudinary(coverLocalPath);
                req.body.coverImage = coverImageUrl;
            }
        } catch (error) {
            console.log(error);
            throw new Error('Error while uploading images to the cloudinary');
        }
    }

    const parseRequestBody = registerUserSchema.safeParse(req.body);

    if (!parseRequestBody.success) {
        return res.status(400).json({
            message: 'empty field',
            errors: parseRequestBody.error.errors.map((item) => item.message),
        });
    }

    try {
        const newUser = new User(parseRequestBody.data);
        const savedUser = await newUser.save();
        if (savedUser) {
            const checkingSavedUser = await User.findById(savedUser._id).select(
                '-password -refreshToken'
            );
            if (!checkingSavedUser) {
                new ApiError(500, 'Internal Server Error');
            }
            return res
                .status(201)
                .json(
                    new ApiResponse(
                        201,
                        'User registered successfully!',
                        checkingSavedUser || {}
                    )
                );
        } else {
            throw new ApiError(500, 'Something went wrong ');
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, username, password } = req.body;
    if (!email && !password) {
        throw new ApiError(400, 'username or email is required');
    }
    const user = await User.findOne({
        $or: [{ username }, { email }],
    }).select('-watchHistory');

    if (!user) {
        throw new ApiError(404, "User doesn't exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid user credentials');
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    const loggedInUser = await User.findOneAndUpdate({
        refreshToken: refreshToken,
    }).select('-password -watchHistory -refreshToken');

    const options = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(200, 'User logged in successfully', {
                user: loggedInUser,
                accessToken,
                refreshToken,
            })
        );
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, 'User logged Out', {}));
});

const getUserChannelProfile = asyncHandler(
    async (req: Request, res: Response) => {
        const { username } = req.params;

        if (!username?.trim()) {
            throw new ApiError(400, 'username is missing');
        }

        const channel = await User.aggregate([
            {
                $match: {
                    username: username?.toLowerCase(),
                },
            },
            {
                $lookup: {
                    from: 'subscriptions',
                    localField: '_id',
                    foreignField: 'channel',
                    as: 'subscribers',
                },
            },
            {
                $lookup: {
                    from: 'subscriptions',
                    localField: '_id',
                    foreignField: 'subscriber',
                    as: 'subscribedTo',
                },
            },
            {
                $addFields: {
                    subscribersCount: {
                        $size: '$subscribers',
                    },
                    channelsSubscribedToCount: {
                        $size: '$subscribedTo',
                    },
                    isSubscribed: {
                        $cond: {
                            if: {
                                $in: [req.user?._id, '$subscribers.subscriber'],
                            },
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
                    subscribersCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1,
                },
            },
        ]);

        if (!channel?.length) {
            throw new ApiError(404, 'channel does not exists');
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    'User channel fetched successfully',
                    channel[0]
                )
            );
    }
);

const changeCurrentPassword = asyncHandler(
    async (req: Request, res: Response) => {
        const { oldPassword, newPassword } = req.body;

        const user = await User.findById(req.user?._id);
        const isPasswordCorrect = await user?.isPasswordCorrect(oldPassword);

        if (!isPasswordCorrect) {
            throw new ApiError(400, 'Invalid old password');
        }
        if (user) {
            user.password = newPassword;
            await user.save({ validateBeforeSave: false });
        }

        return res
            .status(200)
            .json(new ApiResponse(200, 'Password changed successfully', {}));
    }
);

const updateAccountDetails = asyncHandler(
    async (req: Request, res: Response) => {
        let avatarImageLocalPath = '';
        let coverImageLocalPath = '';
        let avatarImageUrl = '';
        let coverImageUrl = '';
        let avatarImagePublicId = '';
        let coverImagePublicId = '';

        try {
            const existingUser = await User.findById(req.user?._id).select(
                'avatarImage coverImage'
            );

            if (req.files && 'avatarImage' in req.files) {
                const avatarImage = req.files['avatarImage'][0];
                avatarImageLocalPath = avatarImage.path;

                if (avatarImageLocalPath) {
                    const avatarImage =
                        await uploadOnCloudinary(avatarImageLocalPath);
                    req.body.avatarImage = avatarImage.url;
                    avatarImagePublicId = avatarImage.public_id;
                }
            }

            if (req.files && 'coverImage' in req.files) {
                const coverImage = req.files['coverImage'][0];
                coverImageLocalPath = coverImage.path;

                if (coverImageLocalPath) {
                    const coverImage =
                        await uploadOnCloudinary(coverImageLocalPath);
                    req.body.coverImage = coverImage.url;
                    coverImagePublicId = coverImage.public_id;
                }
            }

            const parseRequestBody = updateUserSchema.safeParse(req.body);
            if (!parseRequestBody.success) {
                await deleteAssetsFromCloudinary(avatarImagePublicId, 'image');
                await deleteAssetsFromCloudinary(coverImagePublicId, 'image');
                return res.status(400).json({
                    message: 'Empty field',
                    errors: parseRequestBody.error.errors.map(
                        (item) => item.message
                    ),
                });
            }
            const updatedUser = await User.findByIdAndUpdate(
                req.user?._id,
                {
                    $set: {
                        fullName: parseRequestBody.data.fullName,
                        email: parseRequestBody.data.email,
                        avatarImage:
                            parseRequestBody.data.avatarImage ||
                            existingUser?.avatarImage,
                        coverImage:
                            parseRequestBody.data.coverImage ||
                            existingUser?.coverImage,
                    },
                },
                { new: true }
            ).select('-password -refreshToken');

            return res.status(200).json(
                new ApiResponse(200, 'Account details updated successfully', {
                    updatedUser,
                })
            );
        } catch (error) {
            console.log('Internal server error', error);
            await deleteAssetsFromCloudinary(avatarImagePublicId, 'image');
            await deleteAssetsFromCloudinary(coverImagePublicId, 'image');
        }
    }
);

const getWatchHistory = asyncHandler(async (req: Request, res: Response) => {
    //   const user = await User.aggregate([
    //     {
    //         $match: {
    //             _id: new mongoose.Types.ObjectId(req.user._id)
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "videos",
    //             localField: "watchHistory",
    //             foreignField: "_id",
    //             as: "watchHistory",
    //             pipeline: [
    //                 {
    //                     $lookup: {
    //                         from: "users",
    //                         localField: "owner",
    //                         foreignField: "_id",
    //                         as: "owner",
    //                         pipeline: [
    //                             {
    //                                 $project: {
    //                                     fullName: 1,
    //                                     username: 1,
    //                                     avatar: 1
    //                                 }
    //                             }
    //                         ]
    //                     }
    //                 },
    //                 {
    //                     $addFields:{
    //                         owner:{
    //                             $first: "$owner"
    //                         }
    //                     }
    //                 }
    //             ]
    //         }
    //     }
    // ])

    const history = await User.findById(req.user?._id).select('watchHistory');

    res.status(200).json(
        new ApiResponse(200, 'Password changed successfully', { history })
    );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    getUserChannelProfile,
    updateAccountDetails,
    changeCurrentPassword,
    getWatchHistory,
};
