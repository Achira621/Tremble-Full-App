import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessageDocument extends Document {
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    conversation?: mongoose.Types.ObjectId;
    content: string;
    mediaUrl?: string;
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessageDocument>(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        conversation: {
            type: Schema.Types.ObjectId,
            ref: 'Connection',
        },
        content: {
            type: String,
            required: [true, 'Message content is required'],
            maxlength: [1000, 'Message cannot exceed 1000 characters'],
            trim: true,
        },
        mediaUrl: {
            type: String,
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        collection: 'messages',
    }
);

// INDEXES for conversation queries
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 }); // Conversation history
messageSchema.index({ receiver: 1, read: 1 }); // Unread messages
messageSchema.index({ createdAt: -1 }); // Recent messages

messageSchema.set('toJSON', {
    transform: (_doc, ret) => {
        const { __v, ...rest } = ret;
        return rest;
    },
});

const Message: Model<IMessageDocument> = mongoose.model<IMessageDocument>('Message', messageSchema);

export default Message;
