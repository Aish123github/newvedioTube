import mongoose from "mongoose";
import mongooseaggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    views: {
        type: Number,
        required: true,
        default: 0
    },
    duration: {
        type: Number,
        required: true
    },
    isPublished: {
        type: Boolean,
        required: true,
        default: false
    },
    videoFile: {
        type: String,//cloyudinary url
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });   


videoSchema.plugin(mongooseaggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);