import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMatchDocument extends Document {
    user1: mongoose.Types.ObjectId;
    user2: mongoose.Types.ObjectId;
    user1Liked: boolean;
    user2Liked: boolean;
    matchedAt?: Date;
    status: 'pending' | 'matched' | 'unmatched';
    createdAt: Date;
    updatedAt: Date;
}

const matchSchema = new Schema<IMatchDocument>(
    {
        user1: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        user2: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        user1Liked: {
            type: Boolean,
            default: false,
        },
        user2Liked: {
            type: Boolean,
            default: false,
        },
        matchedAt: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['pending', 'matched', 'unmatched'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
        collection: 'matches',
    }
);

matchSchema.index({ user1: 1, user2: 1 }, { unique: true });
matchSchema.index({ user1: 1, status: 1 });
matchSchema.index({ user2: 1, status: 1 });

matchSchema.set('toJSON', {
    transform: (_doc, ret) => {
        const { __v, ...rest } = ret;
        return rest;
    },
});

const Match: Model<IMatchDocument> = mongoose.model<IMatchDocument>('Match', matchSchema);

export default Match;
