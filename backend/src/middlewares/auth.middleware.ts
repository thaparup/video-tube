import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import jwt, {JwtPayload} from "jsonwebtoken"
import { IUser,User } from "../models/user.model";


declare module 'express' {
    interface Request {
      user?: IUser | null; // Define the user property and its type
    }
  }
const verifyJwt = async (req: Request, res: Response, next: NextFunction) => {
    

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
        const decodedToken: string | JwtPayload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || '')
        
        if (!decodedToken || typeof decodedToken === 'string') {
            throw new ApiError(401, "Invalid Access Token")
        }
       
        
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken -watchHistory")
        
       
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, (error as { message: string }).message || "Invalid access token");
}
    
}

export {verifyJwt}