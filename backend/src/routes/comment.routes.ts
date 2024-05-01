import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.middleware';
import {
    createComment,
    getVideoComments,
    updateComment,
} from '../controllers/comment.controller';

const router = Router();

router.use(verifyJwt);
router.route('/c/:videoIdOrTweetId').post(createComment);
router.route('/c/:commentId').patch(updateComment);
router.route('/c/:videoId').get(getVideoComments);

export { router };
