import bcrypt from 'bcrypt';
import { NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose, { Schema, Document,InferSchemaType } from 'mongoose';

// interface IUser extends Document{
//   username: string;
//   email: string;
//   fullName: string;
//   avatarImage: string;
//   coverImage?: string;
//   watchHistory: mongoose.Schema.Types.ObjectId[];
//   password: string;
//   refreshToken: string;
// }
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowecase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatarImage: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true },
);

type User = InferSchemaType<typeof userSchema>;

userSchema.pre('save', async function (next) {


  if (!this.isModified('password')) {
    return next();
  }

  const hash = await bcrypt.hash(this.password, 10);

  this.password = hash;

  return next();
});

userSchema.methods.isPasswordCorrect = async function (
  password: string,
): Promise<boolean> {
  return await bcrypt.compare(password, this.password).catch((e) => false);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },

    'wloU293LuweuifakmKJ&&088t6LKJLKJKLjLKJlkjL&230KLJKLj24lsfslkfsdfla',
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    'jkLhlkhy675GJKgjkkjhfknvTMN KE:b5ljgkhYREVBKhfe76tjk<MFQWSfxcvh74j',
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    },
  );
};




export const User = mongoose.model<User>('User', userSchema);
