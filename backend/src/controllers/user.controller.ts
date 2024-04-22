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


const loginUser = asyncHandler(async (req: Request, res: Response) => {
  
  const { email, username, password } = req.body;
  if (!email && !password) {
    throw new ApiError(400, "username or email is required")
  }
  const user = await User.findOne({
    $or: [{ username }, { email }]
  }).select('-watchHistory')
  
  if (!user) {
    throw new ApiError(404, "User doesn't exist")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)
 
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid user credentials')
  }
 
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  const loggedInUser = await User.findOneAndUpdate({
    refreshToken: refreshToken
  }).select('-password -watchHistory -refreshToken')

  const options = {
    httpOnly: true,
    secure: true,
  }
  return res.status(200).cookie("accessToken", accessToken, options ).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200, "User logged in successfully", {user: loggedInUser, accessToken, refreshToken}))
}
  
 
)


const logoutUser = asyncHandler(async (req: Request, res: Response) => {
   
 
  
  
  
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: 1 
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged Out", {}))
    
  })  


export { registerUser, loginUser, logoutUser };
