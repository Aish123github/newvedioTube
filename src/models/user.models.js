/*
id string pk
username string
email string
password string
createdAt date
updatedAt date
avatar string
coverimage string
watchhistory array
passwordObject object
refreshToken string
*/

import mongoose ,{Schema} from "mongoose"; 
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// here we wrote schema for creating the schema of the user model

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    fullName: {
        type: String,
        required: true,
        index: true,
        trim: true
    },  
    avatar: {
        type: String,
        required: true
    },
    coverImage: {
        type: String
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true });

userSchema.pre("save", async function (next) {
if (!this.isModified("password")) {
    return ;
  }

  this.password = await bcrypt.hash(this.password, 10);
});
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
     console.log("ACCESS SECRET:", !!process.env.ACCESS_TOKEN_SECRET);
    console.log("ACCESS EXPIRY:", process.env.ACCESS_TOKEN_EXPIRY);
    return jwt.sign({ _id: this._id,
         email:this.email,
         username:this.username,
         fullName:this.fullName,
         avatar:this.avatar,
    }, process.env.ACCESS_TOKEN_SECRET,
     { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
    

}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({ _id: this._id,
         email:this.email,
            username:this.username, 
            fullName:this.fullName,
            avatar:this.avatar,
    }, process.env.REFRESH_TOKEN_SECRET,
     { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });
}

export const User = mongoose.model("User", userSchema);// this function will create a structure in the database if it is not already created and it will create a collection called users in the database and it will have the structure of the userSchema
