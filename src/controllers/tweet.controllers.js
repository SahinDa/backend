import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {userId} = req.body
    const {content} = req.body

     if(!content || content.trim().length === 0 ){
        throw new ApiError(400,"Content is Missing")
     }

     const newTweet = await Tweet.create({
        owner : userId,
        content
     })
    
     if(!newTweet){
        throw new ApiError(500,"Something went wrong while creating new tweet")
     }

     return res
     .status(201)
     .json(new ApiResponse(201,newTweet,"Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.user
   const {page = 1, limit = 10} = req.query

    // Ensure page and limit are numbers
    const pageNumber = !isNaN(parseInt(page, 10)) && parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const limitNumber = !isNaN(parseInt(limit, 10)) && parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;

   /* //option 1
    const allTweet = await Tweet.find({
        owner : userId
    }).select("content createdAt")
   */
    //option 2
    const aggregateQuery = await Tweet.aggregate(
        [
            {
                $match : {
                    owner : new mongoose.Types.ObjectId(userId)
                }
            },
            { 
                $sort: { createdAt: -1 }
            },
            {
                $project : {
                    content : 1,
                    createdAt: 1
                }
            }
        ])

     // Pagination options
     const options = {
        page: pageNumber,
        limit: limitNumber
      };

      // Execute paginated aggregation query
    const result = await Tweet.aggregatePaginate(aggregateQuery, options);

     if( result.docs.length === 0  ) {
        return res
        .status(200)
        .json(new ApiResponse(200,[],"You haven't posted any tweets yet"))
     } 

     return res
     .status(200)
     .json(new ApiResponse(200,result,"All tweet fetch successfully"))
    
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {userId} = req.user
    const {content} = req.body

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "Invalid Tweet Id");
    }
 
     const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404,"Tweet  doesn't exist")
    }

    if (!tweet.owner.equals(new mongoose.Types.ObjectId(userId))) {
            throw new ApiError(403, "Unauthorized: You can only update your own tweet");
    }

    if(!content  || content.trim().length === 0){
        throw new ApiError(400,"Tweet content can not be empty")
    }

   tweet.content=content
   const updatedTweet = await tweet.save();

    return res
    .status(200)
    .json(new ApiResponse(200,updatedTweet,"Tweet updated successfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    const {userId} = req.user

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "Invalid Tweet Id");
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404,"Tweet doesn't exist")
    }

    if(!tweet.owner.equals(new mongoose.Types.ObjectId(userId))){
        throw new ApiError(403,"Unauthorized: You can only delete your own tweet")
    }

     await Tweet.findByIdAndDelete(tweetId)

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}