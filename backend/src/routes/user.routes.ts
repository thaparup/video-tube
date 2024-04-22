import { Router } from 'express';
import { loginUser, logoutUser, registerUser } from '../controllers/user.controller';
import { uploadFile } from '../middlewares/file.middleware';
import { verifyJwt } from '../middlewares/auth.middleware';

const router = Router();

router.route('/register').post(
  uploadFile(['jpg', 'jpeg', 'png'], 4).fields([
    { name: 'avatarImage', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  registerUser,
);

router.route('/login').post(loginUser)

// secured routes

router.route('/logout').post(verifyJwt, logoutUser)

export { router };
