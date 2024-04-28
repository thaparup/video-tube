import { Router } from 'express';
import { type Request, Response, NextFunction } from 'express';
import { uploadFile, upload } from '../middlewares/file.middleware';
import { publishAVideo } from '../controllers/video.controller';
import { verifyJwt } from '../middlewares/auth.middleware';
import { publishVideoSchema } from '../schema/video.schema';
import { validationBeforePublishingVideo } from '../middlewares/validationBeforePublishingVideo.middleware';

const router = Router();
router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

router.route('/').post(
  upload().fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  publishAVideo
);

export { router };
