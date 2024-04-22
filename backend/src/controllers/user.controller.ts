import type { Request, Response } from 'express';
import { User } from '../models/user.model';
import { registerUserSchema } from '../schema/user.schema';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { uploadOnCloudinary } from '../utils/cloudinary';

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
        '-password -refreshToken',
      );
      if (!checkingSavedUser) {
        new ApiError(500, 'Internal Server Error');
      }
      return res
        .status(201)
        .json(new ApiResponse(201, 'User registered successfully!',  checkingSavedUser ||{}));
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' })
  }
});

export { registerUser };
