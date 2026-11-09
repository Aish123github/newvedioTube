import {Router} from "express";
import { registerUser, logoutUser, loginUser ,
    refreshAccessToken, changeCurrentUserPassword,getCurrentUser,
   updateAccountDetails, getWatchHistory, updateUserCoverImage, updateUserAvatar,getUserChannelProfile} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {name : "avatar", maxCount : 1},
        {name : "coverImage", maxCount : 1}
    ]),
    registerUser);

    router.route("/login").post(loginUser)
    router.route("/refresh-token").post(refreshAccessToken)
    
    //secure route to logout user
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changeCurrentUserPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

// we used verifyJWT middleware to ensure that only authenticated users can access the logout route.

export default router;