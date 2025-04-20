import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            trim:true,
            lowercase:true
        },
        fullname:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            trim:true,
            lowercase:true
        },
        avatar:{
            type:String,
            required:true
        },
        coverimage:{
            type:String,
            default: ""
        },
        password:{
            type:String,
            required:[true,'Password is required'],
        },
        watchhistory:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:'Video'
            }
        ],
        refreshToken:{
            type:String,
        }
    },
    {timestamps:true}
);

//for encrypting password
userSchema.pre('save',async function(next){
    if(this.isModified('password')){
        this.password = await bcryptjs.hash(this.password,10);
    }
    next();
});
// for comparing password
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcryptjs.compare(password, this.password);
}

// for generating access and refresh token
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            username :this.username,
            fullname : this.fullname,
            email : this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model('User',userSchema);