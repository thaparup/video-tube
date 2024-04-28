import fs from 'node:fs';
import { v2 as cloudinary } from 'cloudinary';

const uploadOnCloudinary = async (localFilePath: string) => {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        if (!localFilePath) {
            throw new Error('Local file path is invalid or missing');
        }

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });

        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        throw new Error('Failed to upload file to Cloudinary');
    }
};

const deleteAssetsFromCloudinary = async (
    id: string,
    resourceType: 'image' | 'video' | 'raw'
) => {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        //  fs.unlinkSync(localPatFile);
        await cloudinary.uploader
            .destroy(id, { resource_type: resourceType })
            .then(() => {});
    } catch (error) {}
};
export { uploadOnCloudinary, deleteAssetsFromCloudinary };
