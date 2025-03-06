import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const {userId} = req.user

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(404,"Invalid Video Id")
    }

    const  existingLike = await Like.findOne({
        video : videoId,
        likedBy : userId
    })

    if(!existingLike){
      const newLike =  await Like.create({
            video:videoId,
            likedBy: userId
         })
       if(!newLike){
        throw new ApiError(500,"Something went wrong while saving new video like")
       }  
       return res
       .status(200)
       .json(new ApiResponse(200,{},"Video liked successfully"))

    }

  const deletedLike =  await Like.findOneAndDelete({
        video : videoId,
        likedBy : userId
       })

       if(!deletedLike){
        throw new ApiError(500,"Something went wrong while removing video like")
       }
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Video like removed successfully"))   

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const {userId} = req.user

    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(404,"Invalid Comment Id")
    }

    const  existingLike = await Like.findOne({
        comment : commentId,
        likedBy : userId
    })

    if(!existingLike){
      const newLike =  await Like.create({
        comment : commentId,
        likedBy : userId
         })

       if(!newLike){
        throw new ApiError(500,"Something went wrong while saving new comment like")
       }  

       return res
       .status(200)
       .json(new ApiResponse(200,{},"Comment liked successfully"))

    }

  const deletedLike =  await Like.findOneAndDelete({
    comment : commentId,
    likedBy : userId
       })

       if(!deletedLike){
        throw new ApiError(500,"Something went wrong while removing comment like")
       }
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Comment like removed successfully"))   


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const {userId} = req.user

    if(!mongoose.Types.ObjectId.isValid(tweetId)){
        throw new ApiError(404,"Invalid Tweet ID")
    }

    const  existingLike = await Like.findOne({
        tweet : tweetId,
        likedBy : userId
    })

    if(!existingLike){
      const newLike =  await Like.create({
        tweet : tweetId,
        likedBy : userId
         })

       if(!newLike){
        throw new ApiError(500,"Something went wrong while saving new tweet like")
       }  
       
       return res
       .status(200)
       .json(new ApiResponse(200,{},"Tweet liked successfully"))

    }

  const deletedLike =  await Like.findOneAndDelete({
    tweet : tweetId,
    likedBy : userId
       })

       if(!deletedLike){
        throw new ApiError(500,"Something went wrong while removing tweet like")
       }
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Tweet like removed successfully"))  
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const {userId} = req.user

    const likedVideo = await Like.aggregate([
        {
            $match : {
                likedBy : new mongoose.Types.ObjectId(userId) ,
            }
        },
        {
            $project : {
                video : 1
            }
        },
        {
            $lookup : {
                from :"videos",
                localField:"video",
                foreignField:"_id" ,
                as : "videoDetails" ,
                pipeline : [
                    {
                        $project : {
                            title :1,
                            thumbnail : 1,
                            _id : 1
                        }
                    }
                ]
            },

        },
        { $unwind: "$videoDetails", preserveNullAndEmptyArrays: true } ,
        { 
            $replaceRoot: { newRoot: { $mergeObjects: ["$videoDetails", "$$ROOT"] } }
        },  
        {
            $project :{
                videoDetails: 0,  // Remove videoDetails
                video: 0          // Remove the original `video` field
            }
        }

    ])

    if(likedVideo.length==0){
        return res
        .status(200)
        .json(new ApiResponse(200,{},"No liked videos found."))
    }

    return res
    .status(200)
    .json(new ApiResponse(200,likedVideo,"Liked video fetch successfully"))

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}