import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';


// Configure Cloudinary with your credentials
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Uploading file

const uploadOnCloudinary = async (filepath)=>{
    try {
        if(!filepath) return null;

        const result = await cloudinary.uploader.upload(filepath, { resource_type: 'auto'});
        console.log(`file uploaded successfully, this is response -> ${result.url}`);
        return result;
    } catch (error) {
        fs.unlinkSync(filepath);
        console.log(`Error uploading file to Cloudinary: ${error.message}`);
    }
}

export {uploadOnCloudinary}