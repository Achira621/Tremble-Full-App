import mongoose, { Document, Schema } from 'mongoose';

// ==========================================
// Notification Schema
// ==========================================
export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    sender?: mongoose.Types.ObjectId; // Optional (system notifications have no sender)
    type: string; // 'match', 'message', 'tremble', 'like', 'view', 'system'
    title: string;
    message: string;
    data?: any; // Extra data like matchId, glimpseId
    isRead: boolean;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);

// ==========================================
// Daily Streak Schema
// ==========================================
export interface IDailyStreak extends Document {
    user: mongoose.Types.ObjectId;
    currentStreak: number;
    lastLoginDate: Date;
    longestStreak: number;
    updatedAt: Date;
}

const dailyStreakSchema = new Schema<IDailyStreak>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    currentStreak: { type: Number, default: 0 },
    lastLoginDate: { type: Date, default: Date.now },
    longestStreak: { type: Number, default: 0 }
}, { timestamps: true });

export const DailyStreak = mongoose.model<IDailyStreak>('DailyStreak', dailyStreakSchema);

// ==========================================
// Achievement Schema
// ==========================================
export interface IAchievement extends Document {
    user: mongoose.Types.ObjectId;
    type: string; // 'first_match', 'social_butterfly', etc.
    unlockedAt: Date;
    progress: number; // 0-100 or count
}

const achievementSchema = new Schema<IAchievement>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0 }
}, { timestamps: true });

achievementSchema.index({ user: 1, type: 1 }, { unique: true });

export const Achievement = mongoose.model<IAchievement>('Achievement', achievementSchema);
