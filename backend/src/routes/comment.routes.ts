import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.middleware';
import { createComment } from '../controllers/comment.controller';

const router = Router();

router.use(verifyJwt);
router.route('/:videoIdOrTweetId').post(createComment);

export { router };
