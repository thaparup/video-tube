import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { createPlaylistSchema } from '../schema/playlist.schema';
import { Playlist } from '../models/playlist.model';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

const createPlaylist = asyncHandler(async (req: Request, res: Response) => {
    req.body.owner = req.user?._id;

    const parseRequestBody = createPlaylistSchema.safeParse(req.body);
    if (!parseRequestBody.success) {
        return res.status(400).json({
            message: 'Empty field',
            errors: parseRequestBody.error.errors.map((item) => item.message),
        });
    }

    const newPlaylist = new Playlist(req.body);
    const savedPlaylist = await newPlaylist.save();

    res.status(201).json(
        new ApiResponse(200, `Playlist creaeted`, savedPlaylist)
    );
});

const getUserPlaylists = asyncHandler(async (req: Request, res: Response) => {
    const findAllPlaylists = await Playlist.find({ onwer: req.user?._id });
    res.status(201).json(
        new ApiResponse(200, `Playlist creaeted`, { findAllPlaylists })
    );
});

const getPlaylistById = asyncHandler(async (req: Request, res: Response) => {
    const { playlistId } = req.params;

    const findPlaylist = await Playlist.findById(playlistId);

    if (!playlistId) {
        throw new ApiError(404, 'Playlist not found');
    }
    res.status(201).json(
        new ApiResponse(200, `Playlist by id `, { findPlaylist })
    );
});

const addVideoToPlaylist = asyncHandler(async (req: Request, res: Response) => {
    const { playlistId, videoId } = req.params;

    // const ifVideoAlreadyExistInThePlaylist = await find;
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $push: { videos: videoId } },
        { new: true }
    );

    if (!updatedPlaylist) {
        throw new ApiError(404, 'Playlist not found');
    }
    res.status(201).json(
        new ApiResponse(200, `Video added to playlist`, { updatedPlaylist })
    );
});

const removeVideoFromPlaylist = asyncHandler(
    async (req: Request, res: Response) => {
        const { playlistId, videoId } = req.params;

        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            { $pull: { videos: videoId } },
            { new: true } // To return the updated document
        );

        if (!updatedPlaylist) {
            throw new ApiError(404, 'Playlist not found ');
        }

        res.status(201).json(
            new ApiResponse(200, `Video removed from playlist`, {
                updatedPlaylist,
            })
        );
    }
);

const deletePlaylist = asyncHandler(async (req: Request, res: Response) => {
    const { playlistId } = req.params;
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if (!deletedPlaylist) {
        throw new ApiError(404, 'Playlist not found');
    }
    res.status(201).json(new ApiResponse(200, `Playlist deleted`, {}));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
};
