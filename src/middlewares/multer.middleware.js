
import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + "-" + uniqueSuffix);
    }
});

export const upload = multer({ storage });
//multer is a middleware for handling multipart/form-data,
//  which is primarily used for uploading files.
//  In this code snippet, we are configuring multer to store uploaded 
// files in the "./public/temp" directory and to give them a unique 
// filename by appending a timestamp and a random number to the original filename. 
// The `upload` variable is then exported for use in other parts of the application where file uploads are needed.