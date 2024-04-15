import { NextFunction } from 'express';
import mongoose,{Schema} from 'mongoose'
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"


interface IUser {
    username: string,
    email: string,
    fullName: string,
    avatar: string,
    coverImage?: string,
    watchHistory: mongoose.Schema.Types.ObjectId[];
    password: string,
    refreshToken:string,
}
const userSchema = new Schema <IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true, 
        index: true
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
        index: true
    },
    avatar: {
        type: String, 
        required: true,
    },
    coverImage: {
        type: String, 
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    refreshToken: {
        type: String
    }

},{timestamps: true})

export const User = mongoose.model<IUser>("User", userSchema);

userSchema.pre("save", async function name(next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
});

userSchema.methods.isPasswordCorrect = async function (password: string) : Promise<boolean> {
    
    return await bcrypt.compare(password,this.password).catch((e)=> false)
   
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
         
        "wloU293LuweuifakmKJ&&088t6LKJLKJKLjLKJlkjL&230KLJKLj24lsfslkfsdfla",
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    ) 
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        "jkLhlkhy675GJKgjkkjhfknvTMN KE:b5ljgkhYREVBKhfe76tjk<MFQWSfxcvh74j",
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}