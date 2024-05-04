import { Router } from 'express';
import {
    loginUser,
    logoutUser,
    registerUser,
    getUserChannelProfile,
    changeCurrentPassword,
    updateAccountDetails,
    getWatchHistory,
} from '../controllers/user.controller';
import { uploadFile } from '../middlewares/file.middleware';
import { verifyJwt } from '../middlewares/auth.middleware';

const router = Router();

router.route('/register').post(
    uploadFile(['jpg', 'jpeg', 'png'], 4).fields([
        { name: 'avatarImage', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 },
    ]),
    registerUser
);

router.route('/login').post(loginUser);
router.route('/channelDetail/:username').get(getUserChannelProfile);
// secured routes

router.route('/logout').post(verifyJwt, logoutUser);
router.route('/update-account').patch(
    verifyJwt,
    uploadFile(['jpg', 'jpeg', 'png'], 4).fields([
        { name: 'avatarImage', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 },
    ]),
    updateAccountDetails
);
router.route('/change-password').post(verifyJwt, changeCurrentPassword);
router.route('/history').get(verifyJwt, getWatchHistory);
export { router };
