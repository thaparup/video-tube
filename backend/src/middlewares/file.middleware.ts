import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';

const storage = multer.diskStorage({
  destination(req: Request, file: Express.Multer.File, callback) {
    callback(null, './public/temp/');
  },
  filename(req: Request, file: Express.Multer.File, callback) {
    const fileName = file.originalname.split('.');

    const ext = fileName[fileName.length - 1];
    callback(
      null,
      `file.originalname-${Math.round(Math.random() * 81837234)}.${ext}`
    );
  },
});
const uploadFile = (extensionArray: Array<string>, fileSize: number) => {
  return multer({
    storage: storage,
    limits: {
      fileSize: 1024 * 1024 * fileSize,
    },
    fileFilter(req: Request, file: Express.Multer.File, callback) {
      const ext = file?.originalname?.split('.').pop()?.toLowerCase();

      if (ext && extensionArray.includes(ext)) {
        callback(null, true); // Accept the file
      } else {
        // Pass an Error object when an error occurs
        callback(null, false);
        throw new Error('File type not supported');
      }
    },
  });
};

const upload = () => {
  return multer({
    storage: storage,
  });
};

export { uploadFile, upload };
