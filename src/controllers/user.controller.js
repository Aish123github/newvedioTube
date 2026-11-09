
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
    // Implementation for generating access and refresh tokens
    // this function will take userId as input and generate access and refresh tokens using jwt.sign method and return it
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false }); // Save the refresh token to the user document without triggering validation
        return {
            accessToken,
            refreshToken
        };
    } catch (error) {
        console.error("Error generating tokens:", error);
        throw new ApiError(500, "Failed to generate tokens");
    }

};

const registerUser = asyncHandler(async (req, res) => {
    // Implementation for user registration
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    const { username, email, password, fullName } = req.body;

    if (
        [fullName, username, email, password].some(field => field?.trim() === "")
    ) {
        // Handle validation errors
        throw new ApiError(400, "All fields are required")
    }
    const existedUser = await User.findOne({
        $or: [
            { username: username },
            { email: email }
        ]
    })
    if (existedUser) {
        throw new ApiError(400, "User already exists")
    }

    //lets handle the images 
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    console.log("Avatar local path:", avatarLocalPath);
    const coverLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required")
    }
    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    // let coverImage = "";
    // if (coverLocalPath) {
    //     coverImage = await uploadOnCloudinary(coverLocalPath)
    // }
    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath)
        if (!avatar) {
            throw new ApiError(500, "Avatar upload failed. Check server logs.");
        }
        console.log("Avatar uploaded to Cloudinary:", avatar);
    } catch (error) {
        console.log("Error uploading avatar image", error)
        throw new ApiError(500, "failed to upload avatar image", error)
    }

    let coverImage =null;
    if(!coverLocalPath) {
        try {
        coverImage = await uploadOnCloudinary(coverLocalPath)
        console.log("Cover image uploaded to Cloudinary:", coverImage);
    } catch (error) {
        console.log("Error uploading cover image", error)
        throw new ApiError(500, "failed to upload cover image", error)
    }
}

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        username: username.toLowerCase(),
        password
    })
    const createdUser = await User.findById(user._id).select("-password -refreshToken -resetPasswordToken -resetPasswordExpire");

    if (!createdUser) {
        throw new ApiError(500, "User creation failed")
    }
    return res
        .status(201)
        .json(new ApiResponse(200, createdUser, "User registered successfully"));

});

const loginUser = asyncHandler(async (req, res) => {
    // Implementation for user login
    const { email, username, password } = req.body;
    //validate the input
    if (!email || !username) {
        throw new ApiError(400, "Email and username is required")
    }
    const user = await User.findOne({
        $or: [
            { username },
            { email }
        ]
    })
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    //validate the password
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid password")
    }
    //if the paswword is correct then we will generate access and refresh tokens and return it to the user
    const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User
        .findById(user._id)
        .select("-password -refreshToken -resetPasswordToken");
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200,
            { user: loggedInUser, accessToken, refreshToken },
            "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
         {
            $set:{ refreshToken: null}
         },
          { new: true });
    const options = {
        httpOnly: true,   
        secure: process.env.NODE_ENV === "production"
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, null, "User logged out successfully"));
});
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken|| req.body.refreshToken ;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }
         if (user.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }
        // const refreshToken = user.generateRefreshToken();
        // const accessToken = user.generateAccessToken();

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        };
        const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200,
                { accessToken,
                  refreshToken: newRefreshToken },
                "Access token refreshed successfully"
            ));
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token");
    }
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
 //get the old password and new password from the request body
 const { oldPassword, newPassword } = req.body;
 // we have the access of user from the req.user object which is set by the verifyJWT middleware
 const user = await User.findById(req.user?._id);
     if (!user) {
        throw new ApiError(404, "User not found");
    }

 const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
 if (!isPasswordCorrect) {
    throw new ApiError(401, "Old password is incorrect");
 }
 user.password = newPassword;
 await user.save({ validateBeforeSave: false });
 return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));

});
const getCurrentUser = asyncHandler(async (req, res) => {
    //user is already stored in the req we just have to return it 
    return res
    .status(200)
    .json(new ApiResponse(200,req.user, " current user details"))
});
const updateAccountDetails = asyncHandler(async (req, res) => {
// here we have to decide what kind of details we want to update and
const {fullName , email}= req.body;
if(!fullName){
    throw new ApiError(400, "Please provide all the required details");
}
if(!email){
    throw new ApiError(400, "Please provide all the required details");
}
const user = await User.findByIdAndUpdate(
    req.user._id,
    {$set:{
        fullName:fullName,
        email:email

    }
},
    {new:true}
).select("-password -refreshToken")
return res.status(200).json( new ApiResponse(
    200, user , "account details updated successfully"
))
});
const updateUserAvatar = asyncHandler(async (req, res) => {

      const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
         const user = await User.findById(req.user._id);  
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Upload new avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }
     if (user.avatar) {
        const publicId = user.avatar
            .split("/upload/")[1]
            .replace(/^v\d+\//, "")
            .replace(/\.[^/.]+$/, "");

        await deleteFromCloudinary(publicId);
    }
    // Update user
    user.avatar = avatar.url;
    await user.save({ validateBeforeSave: false });

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    );
    
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
     const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    // Get the user
    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Delete old image from Cloudinary
    if (user.coverImage) {
        const publicId = user.coverImage
            .split("/upload/")[1]
            .replace(/^v\d+\//, "")
            .replace(/\.[^/.]+$/, "");

        await deleteFromCloudinary(publicId);
    }

    // Upload new image
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage?.url) {
        throw new ApiError(400, "Error while uploading cover image");
    }

    // Update user document
    user.coverImage = coverImage.url;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Cover image updated successfully"
            )
        );
});
const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})



export { registerUser,
     loginUser,
      refreshAccessToken,
       logoutUser , updateAccountDetails ,getCurrentUser , updateUserCoverImage , updateUserAvatar,
    changeCurrentUserPassword , getUserChannelProfile , getWatchHistory } ;