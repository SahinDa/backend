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
  if (!url) return null;

  const parts = url.split("/upload/");
  if (parts.length < 2) return null;

  let publicId = parts[1].split(".")[0]; // Remove file extension

  // Remove version prefix (e.g., v1741383854/)
  publicId = publicId.replace(/^v\d+\//, "");

  return publicId;
};

const deleteOnCloudinary = async (remoteFile) => {
  try {
      if (!remoteFile) {
          console.error("No file URL provided for deletion.");
          return false;
      }

      const publicId = extractPublicIdFromUrl(remoteFile);
      if (!publicId) {
          console.error("Invalid file URL, could not extract publicId.");
          return false;
      }

      // Determine resource type based on file extension
      const isVideo = remoteFile.match(/\.(mp4|mov|avi|mkv|webm)$/i);
      const resourceType = isVideo ? "video" : "image"; // Explicit type

      console.log(`Attempting to delete: ${publicId}, Type: ${resourceType}`);

      const response = await cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
      });

      console.log("Cloudinary Delete Response:", response);
      return response.result === "ok"; // Return true if deleted
  } catch (err) {
      console.error("Error deleting from Cloudinary:", err);
      return false;
  }
};



    export {uploadOnCloudinary ,deleteOnCloudinary};
 
   