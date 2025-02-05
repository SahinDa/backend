import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";


    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });
    
    // Upload an image
    const uploadOnCloudinary=async(localFilePath)=>{
        try{
           if(!localFilePath) return null;
           //upload the file on cloudinary
          const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
           })
          //file has been uploaded successfull
         // console.log("file is uploaded on cloudinary ",response.url)
         fs.unlinkSync(localFilePath)
          return response;

        }catch(error){
         fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload operation got failed
         return null;
        }
    }

    const extractPublicIdFromUrl = (url) => {
        // Split the URL and extract the public ID
        const segments = url.split('/');
        const publicIdWithVersion = segments[segments.length - 1].split('.')[0];
        return publicIdWithVersion;
      };

    const deleteOnCloudinary=async(remotefile)=>{
        try {
            const publicId = extractPublicIdFromUrl(remotefile);
            const response = await cloudinary.uploader.destroy(publicId);
            }catch(err){
             console.error('Error while deleting image from Cloudinary:', err);
             }
    }


    export {uploadOnCloudinary ,deleteOnCloudinary};
 
   