import mongoose from "mongoose";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message 
    const dbStatus = {
        0: "Disconnected",
        1: "Connected",
        2: "Connecting",
        3: "Disconnecting"
    };
    
    const dbConnected = mongoose.connection.readyState;
    
    if (dbConnected !== 1) {
        throw new ApiError(503, `Database is ${dbStatus[dbConnected]}`);
    }
    
    return res.status(200).json(new ApiResponse(200, { database: dbStatus[dbConnected] }, "API is running smoothly"));
    
})

export {
    healthcheck
    }
    