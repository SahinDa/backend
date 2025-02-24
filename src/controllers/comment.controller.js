import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import { Video } from "../models/video.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    // Ensure page and limit are numbers
    const pageNumber = !isNaN(parseInt(page, 10)) && parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const limitNumber = !isNaN(parseInt(limit, 10)) && parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;

     // Validate videoId
     if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400,"Video id is invalid")
    }
    

 //  Check if the video actually exists
 const videoExists = await Video.exists({ _id: videoId });
 if (!videoExists) {
     throw new ApiError(404, "Video not found");
 }

     // Aggregate query to find comments for the given videoId
     const aggregateQuery = Comment.aggregate([
        {
          $match : { 
             video: new mongoose.Types.ObjectId(videoId)
          },
         }, // Filter by videoId
        { 
            $sort: { createdAt: -1 }
        }, // Sort by latest comments first
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline :[
                    {
                        $project : {
                            fullName : 1,
                            username : 1,
                            avatar : 1 
                        }
                    }
                ]
            }
        }


      ]);

      // Pagination options
    const options = {
        page: pageNumber,
        limit: limitNumber
      };


    // Execute paginated aggregation query
    const result = await Comment.aggregatePaginate(aggregateQuery, options);

    if (!result.docs.length) {
        throw new ApiError(404, "No comments found for this video");
    }

    return res
    .status(200)
    .json(new ApiResponse(200,result,"Comment Successfully Fetch"));
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {userId} = req.user
    const {content} = req.body

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid Video ID")
    }

    //  Check if the video actually exists
    const videoExists = await Video.countDocuments({ _id: videoId });
   if (!videoExists) {
     throw new ApiError(404, "Video not found");
    }

    if (!content || content.trim().length < 1) {
        throw new ApiError(400, "Comment content cannot be empty");
    }

    const comment = await Comment.create({
        content,
        video:videoId,
        owner : userId,
    })

    if(!comment){
        throw new ApiError(500,"Something went wrong while adding new comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,comment,"Comment added successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
     const {commentId} = req.params
     const {userId} = req.user
     const {content} = req.body

     if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400,"Invalid Comments Id")
     }

     const comment = await Comment.findById(commentId);

     if(!comment){
        throw new ApiError(404,"Comments doesn't exist")
     }

     if (!comment.owner.equals(new mongoose.Types.ObjectId(userId))) {
        throw new ApiError(403, "Unauthorized: You can only edit your own comments");
    }
    

     if (!content || content.trim().length < 1) {
        throw new ApiError(400, "Comment content cannot be empty");
    }

    comment.content=content;
    const  savedComment= await comment.save();
    return res
    .status(200)
    .json(new ApiResponse(200,savedComment,"Comment update successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    const {userId} = req.user

    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400,"Invalid Comments Id")
     }

     const deletedComment = await Comment.findOneAndDelete(
        {
            _id : commentId,
            owner : userId
        }
     )

     if(!deletedComment){
        throw new ApiError(404,"Comment not found or you are not authorized to delete it")
     }

     return res
     .status(200)
     .json( new ApiResponse(200,{},"Comment deleted successfully"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }