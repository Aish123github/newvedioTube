import {ApiResponse} from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
// health check controller to check if the server is running
const healthCheck = asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200, "Health check successful", { status: "ok" }));
});


export { healthCheck };