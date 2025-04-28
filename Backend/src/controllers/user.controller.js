import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinaryUpload.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res)=>{
    // Steps to register the user:
    /*
        1. We will get the data of the user from frontend/postman
        2. Validation (empty or not)
        3. Then we will check if this user is already registered or not (by username or email)
        4. Check for images (avatar is cumpulsory)
        5. If yes, then we will upload the image to cloudinary (avatar uploaded or not)
        6. we will create a new user and save it to database
        7. remove password and refresh token from the response
        8. Send feedback to the user that user is registered successfully
        9. return response
    */
   const {username, fullname, email, password} = req.body;
   //console.log(req.body);

   if(!username.trim()){
        throw new ApiError(400, "Username is required")
   }
   if(!fullname.trim()){
        throw new ApiError(400, "Fullname is required")
   }
    if(!email.trim()){
        throw new ApiError(400, "Email is required")
    }
    if(!password.trim()){
        throw new ApiError(400, "Password is required")
    }

    // Check if user already exists

    const userExists = await User.findOne({$or : [{username},{email}]});

    if(userExists){
        throw new ApiError(409, "This username or email already exists")
    }

    // Check for images
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverLocalPath = req.files?.coverimage?.[0]?.path;
    

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    // Uploading images to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverimage = await uploadOnCloudinary(coverLocalPath);

    if(!avatar){
        throw new ApiError(500, "Error uploading avatar to cloudinary")
    }

    // Creating user
    const user = await User.create({
        username: username.toLowerCase(),
        fullname,
        email,
        password,
        avatar: avatar.url,
        coverimage: coverimage?.url
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong, Error while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully", true)
    )
});

const loginUser = asyncHandler(async (req, res)=>{
    // Steps to login the user: 
    /*
        1. We will get the email or username and password from frontend
        2. We will check fields are empty or not (validate)
        3. We will check if this user is already registered or not
        4. If yes, then we will check if password is matched
        5. If yes, then we will generate the access token and refresh token
        6. We will send the access token and refresh token to the user in cookies
     */

    const {username,email, password} = req.body;

    if(!username.trim() && !email.trim()){
        throw new ApiError(400,'Username or email is required');
    }

    if(!password.trim()) throw new ApiError(400, 'Password is required');

    const user = await User.findOne({$or : [{username},{email}]});

    if(!user) throw ApiError(400, "user does not exist");

    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid) throw new ApiError(400, 'Username or password is incorrect');

    try{
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});

        const options = {
            httpOnly : true,
            secure : true,
        }

        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user : user, accessToken, refreshToken
                },
                "User logged in successfully"
            )
        )
    }
    catch{
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
});

const logoutUser = asyncHandler(async (req, res)=>{
    // steps
    /*
    1. get the data of user
    2. set the refreshtoken to null
    3. clear the cookies
     */

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true,
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,
            {},
            "user logged out successfully"
        )
    )
})

const refreshAccessToken = asyncHandler(async(req , res)=>{
    //firstly we need the refreshtoken of the user to validate
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken) throw new ApiError(401, "Refresh token is expired");

    const incomingDecodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(incomingDecodedToken?._id);

    if(!user) throw new ApiError(401,"Refresh token is expired");

    if(incomingDecodedToken !== user.refreshToken){
        throw new ApiError(401,"Refresh token is expired");
    }

    //generating new tokens both refreshToken and accessToken
    try{
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});

        const options = {
            httpOnly : true,
            secure : true,
        }

        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user : user, accessToken, refreshToken
                },
                "AccessToken refreshed successfully"
            )
        )
    }
    catch{
        throw new ApiError(500, "Something went wrong while refreshing tokens");
    }
})

const changePassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user?._id);

    const isMatched = await user.isPasswordCorrect(oldPassword);

    if(!isMatched) throw new ApiError(400,"invalid password")

    user.password = newPassword;
    await user.save({validateBeforeSave : false});

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Password changed successfully"
    ))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "user fetched successfully"))
})

const updateDetails = asyncHandler(async(req,res)=>{
    const fullname = req.body

    if(!fullname) throw new ApiError(400, "fullname is required")

    const user = User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullname
            }
        },
        {
            new : true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user , "fullname updated successfully"))
})

const updateAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.avatar?.[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar){
        throw new ApiError(500, "Error uploading avatar to cloudinary")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            avatar: avatar.url
        },
        {
            new : true
        }
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, "Avatar updated successfully"))
})

const updateCoverImage = asyncHandler(async(req,res)=>{
    const coverLocalPath = req.file?.coverimage?.[1]?.path;

    if(!coverLocalPath){
        throw new ApiError(400, "Coverimage file is missing")
    }

    const coverimage = await uploadOnCloudinary(avatarLocalPath);
    if(!coverimage){
        throw new ApiError(500, "Error uploading coverimage to cloudinary")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            coverimage : coverimage.url
        },
        {
            new : true
        }
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, "Coverimage updated successfully"))
})
export {registerUser, loginUser , logoutUser, refreshAccessToken, changePassword, getCurrentUser, updateDetails, updateAvatar, updateCoverImage};