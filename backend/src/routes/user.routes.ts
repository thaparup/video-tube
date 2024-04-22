import { Router } from 'express';
import { registerUser } from '../controllers/user.controller';
import { uploadFile } from '../middlewares/file.middleware';

const router = Router();

router.route('/register').post(
  uploadFile(['jpg', 'jpeg', 'png'], 4).fields([
    { name: 'avatarImage', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  registerUser,
);

export { router };
