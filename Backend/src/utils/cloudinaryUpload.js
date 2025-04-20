import {v2 as cloudinary} from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';


// Configure Cloudinary with your credentials
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Uploading file

const uploadOnCloudinary = async (filepath) => {
    try {
      if (!filepath) {
        return null;
      }
  
      const fileExists = fs.existsSync(filepath);
  
      if (!fileExists) {
        return null;
      }
  
      const result = await cloudinary.uploader.upload(filepath, {
        resource_type: "auto",
      });
      
      fs.unlinkSync(filepath);
      return result;
  
    } catch (error) {
      console.error("❌ Cloudinary Upload Error:", error);
      try {
        fs.unlinkSync(filepath);
      } catch (unlinkError) {
        console.error(`Error deleting file: ${unlinkError.message}`);
      }
  
      return null;
    }
  };
  

export {uploadOnCloudinary}