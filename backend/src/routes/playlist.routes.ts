import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.middleware';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
} from '../controllers/playlist.controller';

const router = Router();

router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

router.route('/').post(createPlaylist);

router.route('/:playlistId').get(getPlaylistById).delete(deletePlaylist);

router.route('/add/:videoId/:playlistId').patch(addVideoToPlaylist);
router.route('/remove/:videoId/:playlistId').patch(removeVideoFromPlaylist);

router.route('/user/:userId').get(getUserPlaylists);

export { router };
