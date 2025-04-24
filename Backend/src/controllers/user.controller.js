import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinaryUpload.js";
import ApiResponse from "../utils/ApiResponse.js";

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
        const AccessToken = await user.generateAccessToken();
        const RefreshToken = await user.generateRefreshToken();

        user.refreshToken = RefreshToken;
        await user.save({validateBeforeSave : false});

        const options = {
            httpOnly : true,
            secure : true,
        }

        return res.status(200)
        .cookie("accessToken", AccessToken, options)
        .cookie("refreshToken", RefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user : user, AccessToken, RefreshToken
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

    User.findByIdAndUpdate(
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
    .clearCookie("AccessToken",options)
    .clearCookie("RefreshToken",options)
    .json(
        new ApiResponse(
            200,
            {},
            "user logged out successfully"
        )
    )
})
export {registerUser, loginUser , logoutUser};