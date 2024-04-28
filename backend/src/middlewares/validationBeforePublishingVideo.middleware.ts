// import  {type Request, type Response, type NextFunction} from "express"
import { publishVideoSchema } from '../schema/video.schema';
import { asyncHandler } from '../utils/asyncHandler';
import { Request, Response, NextFunction } from 'express';

const validationBeforePublishingVideo = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parseRequestBody = publishVideoSchema.safeParse(req.body);
    console.log(parseRequestBody.success);
    if (!parseRequestBody.success) {
      return res.status(400).json({
        message: 'Empty field',
        errors: parseRequestBody.error.errors.map((item) => item.message),
      });
    }
    next();
  }
);

export { validationBeforePublishingVideo };
