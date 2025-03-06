import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
   //TODO: create playlist
    const {userId} = req.user
    
    if(!name || name.trim().length === 0){
        throw new ApiError(400, "Playlist name cannot be empty");
    }

    if(!description || description.trim().length === 0){
        throw new ApiError(400, "Description  cannot be empty");
    }

    const existingPlaylist = await Playlist.findOne({
        name ,
        owner : userId
    })

    if(existingPlaylist){
        throw new ApiError(409,"A playlist with this name already exists. Please choose a different name.")
    }


     const  newPlaylist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner : userId ,
        videos : []
     })

     if(!newPlaylist){
        throw new ApiError(500,"An error occurred while creating the playlist.")
     }

     return res
     .status(201)
     .json( new ApiResponse(201,newPlaylist,"Playlist Successfully Created "))
      
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    const { userId: loggedInUserId } = req.user; 

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid User Id");
    }

    if (loggedInUserId.toString() !== userId) {
        throw new ApiError(403, "Unauthorized access");
    }

     const playlists = await Playlist.find({
        owner : userId
     })

     return res
     .status(200)
     .json(new ApiResponse(200,playlists,"User all playlist successfully retrieve"))


})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    const {userId} = req.user

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"Invalid playlist Id")
    }

    const playlist = await Playlist.findOne({
        _id : playlistId,
        owner : userId
    })

    if(!playlist){
        throw new ApiError(404,"Playlist does not exist or you do not have access to it.")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Playlist retrieved successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const {userId} = req.user

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"Invalid playlist Id")
    }

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }

    const exists = await Video.exists({ _id: videoId });
     
    if(!exists){
        throw new ApiError(404,"Video not found")
    }

    const playlist = await Playlist.findOne({
        _id : playlistId,
        owner : userId
    })

     if(!playlist){
        throw new ApiError(404,"Playlist does not exist or you do not have access to it.")
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video is already in the playlist.");
    }

    playlist.videos.push(videoId)
     await playlist.save();

     return res
     .status(200)
     .json(new ApiResponse(200,{},"Video added to playlist "))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const {userId} = req.user
    // TODO: remove video from playlist
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"Invalid playlist Id")
    }

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }

    const playlist = await Playlist.findOne({
        _id : playlistId,
        owner : userId
    })

    if(!playlist){
        throw new ApiError(404,"Playlist does not exist or you do not have access to it.")
    }

    const videoObjectId = new mongoose.Types.ObjectId(videoId);
    if (!playlist.videos.some(id => id.equals(videoObjectId))) {
        throw new ApiError(400, "Video is not in the playlist.");
    }
    playlist.videos.pull(videoObjectId);
    await playlist.save();

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Video removed successfully from playlist"))


})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    const {userId} = req.user

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"Invalid Playlist Id")
    }

    const  playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }
 
    if(!playlist.owner.equals(new mongoose.Types.ObjectId(userId))){
        throw new ApiError(403, "Access denied: You can only delete your own playlists");
    }

   const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

   if(!deletedPlaylist){
    throw new ApiError(500,"Unexpected error: Failed to delete the playlist. Please try again later.")
   }

   return res
   .status(200)
   .json(new ApiResponse(200,{},"Playlist deleted successfully"))

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    const {userId} = req.user
    //TODO: update playlist

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"Invalid Playlist Id")
    }

    if ((!name || name.trim().length === 0) && (!description || description.trim().length === 0)) {
        throw new ApiError(400, "At least one of 'name' or 'description' must be provided.");
    }

    const  playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }
 
    if(!playlist.owner.equals(new mongoose.Types.ObjectId(userId))){
        throw new ApiError(403, "Access denied: You can only delete your own playlists");
    }

     if (name && name.trim().length > 0) {
    playlist.name = name.trim();
      }
      if (description && description.trim().length > 0) {
    playlist.description = description.trim();
      }
    const updatedPlaylist = await playlist.save();

    return res
    .status(200)
    .json(new ApiResponse(200,updatedPlaylist,"Playlist updated successfully"))


})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}