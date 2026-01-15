import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPostDocument extends Document {
    user: mongoose.Types.ObjectId;
    caption: string;
    mediaUrl: string;
    thumbnailUrl?: string;
    mediaType: 'image' | 'video';
    location?: string;
    likes: mongoose.Types.ObjectId[];
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const postSchema = new Schema<IPostDocument>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true, // Fast lookup by user
        },
        caption: {
            type: String,
            maxlength: [2200, 'Caption cannot exceed 2200 characters'],
            trim: true,
            default: '',
        },
        mediaUrl: {
            type: String,
            required: [true, 'Media URL is required'],
        },
        thumbnailUrl: {
            type: String,
        },
        mediaType: {
            type: String,
            enum: ['image', 'video'],
            default: 'image',
        },
        location: {
            type: String,
            trim: true,
        },
        likes: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        likesCount: {
            type: Number,
            default: 0,
            index: true, // For trending posts
        },
        commentsCount: {
            type: Number,
            default: 0,
        },
        viewsCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        collection: 'posts',
    }
);

// INDEXES for optimized feed queries
postSchema.index({ user: 1, createdAt: -1 }); // User's posts chronologically
postSchema.index({ createdAt: -1 }); // Global feed
postSchema.index({ likesCount: -1, createdAt: -1 }); // Popular posts
postSchema.index({ location: 1, createdAt: -1 }); // Location-based feed

// Optimize JSON output
postSchema.set('toJSON', {
    transform: (_doc, ret) => {
        const { __v, ...rest } = ret;
        return rest;
    },
});

const Post: Model<IPostDocument> = mongoose.model<IPostDocument>('Post', postSchema);

export default Post;
