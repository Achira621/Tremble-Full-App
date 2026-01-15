import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConnectionDocument extends Document {
    follower: mongoose.Types.ObjectId;
    following: mongoose.Types.ObjectId;
    status: 'pending' | 'accepted' | 'blocked';
    createdAt: Date;
    updatedAt: Date;
}

const connectionSchema = new Schema<IConnectionDocument>(
    {
        follower: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        following: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'blocked'],
            default: 'accepted', // Direct follow without approval for now
        },
    },
    {
        timestamps: true,
        collection: 'connections',
    }
);

// COMPOUND INDEXES for fast relationship queries
connectionSchema.index({ follower: 1, following: 1 }, { unique: true }); // Prevent duplicate follows
connectionSchema.index({ follower: 1, status: 1 }); // Get user's following list
connectionSchema.index({ following: 1, status: 1 }); // Get user's followers
connectionSchema.index({ follower: 1, following: 1, status: 1 }); // Check if following

connectionSchema.set('toJSON', {
    transform: (_doc, ret) => {
        const { __v, ...rest } = ret;
        return rest;
    },
});

const Connection: Model<IConnectionDocument> = mongoose.model<IConnectionDocument>('Connection', connectionSchema);

export default Connection;
