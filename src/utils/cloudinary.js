import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        // console.log("cloudinary config:",
        //     {
        //         cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        //         api_key: process.env.CLOUDINARY_API_KEY,
        //         api_secret: process.env.CLOUDINARY_API_SECRET,
        //     });
            if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        console.log("file uploaded on Cloudinary , file src:" + response.url);

        // once the file is uploaded to Cloudinary, you can delete the local file if needed
        fs.unlinkSync(localFilePath);
        return response; // Return the URL of the uploaded file
    } catch (error) {
        console.error("Error uploading file to Cloudinary:", error);
          console.error("Full error:", error);
        // console.error("Error uploading file to Cloudinary:", error);
        return null;
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("File deleted from Cloudinary:", publicId);
        return result;
    } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };