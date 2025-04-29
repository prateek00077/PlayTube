import {Router} from 'express';
import { loginUser,registerUser,logoutUser, refreshAccessToken, updateCoverImage, changePassword, getCurrentUser, updateDetails, updateAvatar, getUserChannelProfile, getWatchHistory } from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const userRouter = Router();

userRouter.route('/register').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverimage',
            maxCount: 1
        }
    ]),
    registerUser);

userRouter.route('/login').post(loginUser)
userRouter.route('/logout').post(verifyJWT, logoutUser)
userRouter.route('/refreshToken').post(refreshAccessToken)
userRouter.route('/cover-image').patch(verifyJWT,upload.single("/coverimage"), updateCoverImage)
userRouter.route('/change-password').post(verifyJWT,changePassword)
userRouter.route('/current-user').get(verifyJWT,getCurrentUser)
userRouter.route('/update-details').post(verifyJWT,updateDetails)
userRouter.route('/avatar').patch(verifyJWT,upload.single("avatar"),updateAvatar)
userRouter.route('/c/:username').get(verifyJWT,getUserChannelProfile)
userRouter.route('/watchHistory').get(verifyJWT,getWatchHistory)

export default userRouter;