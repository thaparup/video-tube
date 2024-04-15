import express from 'express'
import multer from 'multer'




const storage  = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, './public/temp/') 
    },
    filename(req, file, callback) {
        const fileName = file.originalname.split(".");
        
        const ext = fileName[fileName.length - 1];
        callback(
            null,
          `file.originalname-${Math.round(Math.random() * 81837234)}.${ext}`
        );
    },
})
const uploadFile = (extensionArray: Array<string>, fileSize: number, numberOfFiles: number)=>{

   return multer({
    storage: storage,
       limits:{
        fileSize: fileSize,
        files: numberOfFiles
       },
       fileFilter(req, file, callback) {
        const ext = file?.originalname?.split(".").pop()?.toLowerCase();
        
      if (ext && extensionArray.includes(ext)) {
                callback(null, true); // Accept the file
            } else {
                // Pass an Error object when an error occurs
                callback(null, false);
                throw new Error("File type not supported")
            }
       },
   })
}
export {uploadFile}


