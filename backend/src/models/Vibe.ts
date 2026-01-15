import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVibeDocument extends Document {
    name: string;
    icon: string; // Emoji or URL
    type: 'mood' | 'interest' | 'achievement';
    description?: string;
    createdAt: Date;
}

const vibeSchema = new Schema<IVibeDocument>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        icon: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['mood', 'interest', 'achievement'],
            default: 'mood',
        },
        description: {
            type: String,
        },
    },
    {
        timestamps: true,
        collection: 'vibes',
    }
);

const Vibe: Model<IVibeDocument> = mongoose.model<IVibeDocument>('Vibe', vibeSchema);

export default Vibe;
