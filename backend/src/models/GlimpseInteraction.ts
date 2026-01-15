import mongoose, { Document, Schema } from 'mongoose';

// ==========================================
// Interaction Schema (Likes, Trembles, Views)
// ==========================================
export interface IGlimpseInteraction extends Document {
    glimpse: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    type: 'view' | 'like' | 'tremble' | 'share' | 'skip';
    createdAt: Date;
}

const glimpseInteractionSchema = new Schema<IGlimpseInteraction>({
    glimpse: {
        type: Schema.Types.ObjectId,
        ref: 'Glimpse',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['view', 'like', 'tremble', 'share', 'skip'],
        required: true
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate likes/trembles/views from same user if we want uniqueness
// For 'view', maybe we allow multiple? For 'like', definitely unique.
glimpseInteractionSchema.index({ glimpse: 1, user: 1, type: 1 });

export const GlimpseInteraction = mongoose.model<IGlimpseInteraction>('GlimpseInteraction', glimpseInteractionSchema);


// ==========================================
// Comment Schema
// ==========================================
export interface IGlimpseComment extends Document {
    glimpse: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
}

const glimpseCommentSchema = new Schema<IGlimpseComment>({
    glimpse: {
        type: Schema.Types.ObjectId,
        ref: 'Glimpse',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 300
    }
}, {
    timestamps: true
});

export const GlimpseComment = mongoose.model<IGlimpseComment>('GlimpseComment', glimpseCommentSchema);
