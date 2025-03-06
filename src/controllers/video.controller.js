import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy='createdAt', sortType='-1', userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    // Ensure page and limit are numbers
     const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const validSortBy = ['createdAt', 'title', 'views', 'duration'];
    if (!validSortBy.includes(sortBy)) {
      return res.status(400).json({ error: 'Invalid sortBy field' });
    }

     // Validate sort type (only allow "1" or "-1")
    const validSortType = ['1', '-1'];
    const sortTypeNumber = validSortType.includes(sortType) ? parseInt(sortType, 10) : -1;

 const searchQuery = query ? query.toString().trim() : '';

   const searchFilter = {
        ...(userId && { owner: new mongoose.Types.ObjectId(userId)  }),
        ...(searchQuery.trim() !== '' && {
            $or: [
                { title: { $regex: new RegExp(searchQuery, 'i') } },
                { description: { $regex: new RegExp(searchQuery, 'i') } }
            ]
        }),
    };
 


    // Sorting options
    const sortOptions = { [sortBy]: sortTypeNumber };

    // Aggregate query with filters and sorting
    const aggregateQuery = Video.aggregate([
        { $match: searchFilter },
        { $sort: sortOptions },
    ]);

      const options = {
        page: pageNumber,
        limit: limitNumber,
      };

      const result = await Video.aggregatePaginate(aggregateQuery, options);

      if(result.docs.length === 0){
        throw new ApiError(404, "No video found");
      }

      return res
      .status(200)
      .json(new ApiResponse(200,result,"Video successfully retrieve"));
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
     const {userId} = req.user 

     if((!title || title.trim().length === 0) || (!description || description.trim().length === 0)){
         throw new ApiError(400,"Title and description both required")
     }

     const videofile = req.files?.videoFile[0]?.path;
     const thumbnail = req.files?.thumbnail[0]?.path;

     if (!videofile) {
      throw new ApiError(400, "Video file is required");
      }
     if (!thumbnail) {
      throw new ApiError(400, "Thumbnail file is required");
      }

      const uploadedVideo = await uploadOnCloudinary(videofile);

      if(!uploadedVideo){
        throw new ApiError(400,"Video file is required")
      }

      const uploadedThumbnail = await uploadOnCloudinary(thumbnail);

      if(!uploadedThumbnail){
        throw new ApiError(400,"Thumbnail file is required")
      }

      const newVideo = await Video.create({
         title : title.trim(),
         description : description.trim(),
         owner : userId,
         videoFile: uploadedVideo.url,
         thumbnail : uploadedThumbnail.url,
         duration : uploadedVideo.duration
      })

    if(!newVideo){
      throw new ApiError(500,"Something went wrong while publishing new video")
    }  

    return res
    .status(201)
    .json(new ApiResponse(201,newVideo,"Video publish successfully"))
})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!isValidObjectId(videoId)){
      throw new ApiError(400,"Invalid Video Id")
    }

    const video = await Video.aggregate([
      {
        $match : {
            _id : new mongoose.Types.ObjectId(videoId)
        },
      },
      {
        $lookup : {
          from : "users",
          localField:"owner",
          foreignField : "_id",
          as : "ownerDetails",
          pipeline:[
            {
              $project : {
                fullName :1,
                avatar : 1,
                email : 1,
                username :1,

              }
            }
          ]
        }
      },
      {
        $unwind: {
            path: "$ownerDetails", // Convert ownerDetails array to an object
            preserveNullAndEmptyArrays: true, // Keep videos even if owner is missing
        },
    },
    {
        $set: {
            fullName: "$ownerDetails.fullName",
            avatar: "$ownerDetails.avatar",
            email: "$ownerDetails.email",
            username: "$ownerDetails.username"
        }
    },
    {
        $unset: ["owner", "ownerDetails"] // Remove original owner reference
    }
    ])

    if(video.length === 0){
      throw new ApiError(404,"Video not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,video[0],"Video retrieve successfully"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title,description} = req.body 
    const thumbnail = req.file?.path;
    
    if(!isValidObjectId(videoId)){
      throw new ApiError(400,"Invalid Video Id")
    }

    const video = await Video.findById(videoId);

    if(!video){
      throw new ApiError(404,"Video not found")
    }

    let isUpdated = false;

    if(title?.trim().length){
      video.title = title.trim()
      isUpdated = true
    }

    if(description?.trim().length){
      video.description=description.trim()
      isUpdated = true
    }

    if(thumbnail){
      const oldThumbnail = video.thumbnail
      const newThumbnail = await uploadOnCloudinary(thumbnail);
       if(newThumbnail?.url){
        video.thumbnail = newThumbnail.url
        await deleteOnCloudinary(oldThumbnail);
         isUpdated = true
       } else {
        throw new ApiError(500,"Something went wrong while updating thumbnail ")
       }
    }
  
    if(!isUpdated){
      return res
      .status(200)
      .json(new ApiResponse(200,{},"Nothing to update"))
    }
    await video.save();
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Video updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
      const {userId} = req.user

    if(!isValidObjectId(videoId)){
      throw new ApiError(400,"Invalid Video Id")
    }

      const video = await Video.findOneAndDelete({ _id: videoId, owner: userId });

    if(!video){
      throw new ApiError(404,"Video not found or you are not authorized to delete it")
    }


   // TODO: Improve error handling to ensure both video and thumbnail are deleted reliably.
    // If one fails, consider implementing a rollback mechanism or logging failed deletions for future cleanup.
    await deleteOnCloudinary(video.thumbnail)
    await deleteOnCloudinary(video.videoFile)
     

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {userId} = req.user

    if(!isValidObjectId(videoId)){
      throw new ApiError(400,"Invalid Video Id")
    }

      const video = await Video.findOne({ _id: videoId, owner: userId });

   if(!video){
        throw new ApiError(404, "Video not found or you are not authorized to change publish status");
    }

    video.isPublished = !video.isPublished
     
    await video.save();

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Video publish status toggle successfully"))


})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}