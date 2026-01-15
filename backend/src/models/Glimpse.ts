import mongoose, { Document, Schema } from 'mongoose';

export interface IGlimpse extends Document {
    user: mongoose.Types.ObjectId;
    photoUrl: string;
    caption?: string;
    mood?: string;
    location?: {
        city: string;
        coordinates?: { lat: number; lng: number };
    };
    musicTrack?: {
        name: string;
        artist: string;
        url?: string;
    };
    tags: string[];
    views: number;
    likes: number;
    comments: number;
    trembles: number;
    shares: number;
    isActive: boolean;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const glimpseSchema = new Schema<IGlimpse>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    photoUrl: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        maxlength: 150,
        trim: true
    },
    mood: {
        type: String,
        enum: [
            'vibing', 'exploring', 'chilling', 'party',
            'romantic', 'adventurous', 'creative',
            'peaceful', 'energetic', 'mysterious'
        ],
        default: 'vibing'
    },
    location: {
        city: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    musicTrack: {
        name: String,
        artist: String,
        url: String
    },
    tags: [String],
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    comments: {
        type: Number,
        default: 0
    },
    trembles: {
        type: Number,
        default: 0
    },
    shares: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: Date
}, {
    timestamps: true
});

// Indexes for feed algorithm performance
glimpseSchema.index({ createdAt: -1 });
glimpseSchema.index({ likes: -1, views: -1 });
glimpseSchema.index({ tags: 1 });
glimpseSchema.index({ mood: 1 });

export default mongoose.model<IGlimpse>('Glimpse', glimpseSchema);
