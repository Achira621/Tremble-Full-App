import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDocument extends Document {
    username: string;
    email: string;
    password: string;
    fullName: string;
    bio?: string;
    profilePhoto?: string;
    followers: mongoose.Types.ObjectId[];
    following: mongoose.Types.ObjectId[];
    followersCount: number;
    followingCount: number;
    postsCount: number;
    lastActive: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    // Tremble Social Signals
    vibes: string[]; // List of vibe names
    badges: {
        name: string;
        icon: string;
        dateEarned: Date;
    }[];
    curiosityScore: number;
}

const userSchema = new Schema<IUserDocument>(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
            lowercase: true,
            minlength: [3, 'Username must be at least 3 characters'],
            maxlength: [30, 'Username cannot exceed 30 characters'],
            match: [/^[a-z0-9._]+$/, 'Username can only contain lowercase letters, numbers, dots and underscores'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Don't include password by default
        },
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
            maxlength: [50, 'Full name cannot exceed 50 characters'],
        },
        bio: {
            type: String,
            maxlength: [150, 'Bio cannot exceed 150 characters'],
            trim: true,
        },
        profilePhoto: {
            type: String,
            default: '',
        },
        followers: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        following: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        followersCount: {
            type: Number,
            default: 0,
        },
        followingCount: {
            type: Number,
            default: 0,
        },
        postsCount: {
            type: Number,
            default: 0,
        },
        lastActive: {
            type: Date,
            default: Date.now,
        },
        // Tremble Social Features
        vibes: [{
            type: String,
            trim: true,
        }],
        badges: [{
            name: { type: String, required: true },
            icon: { type: String, required: true },
            dateEarned: { type: Date, default: Date.now },
        }],
        curiosityScore: {
            type: Number,
            default: 100, // Start with a base curiosity score
        },
    },
    {
        timestamps: true,
        // Optimize query performance
        collection: 'users',
    }
);

// INDEXES for optimized queries
// userSchema.index({ username: 1 }); // Already defined as unique
// userSchema.index({ email: 1 }); // Already defined as unique
userSchema.index({ createdAt: -1 });
userSchema.index({ followersCount: -1 }); // For popular users
userSchema.index({ username: 'text', fullName: 'text' }); // For search

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Don't return password and version in JSON
userSchema.set('toJSON', {
    transform: (_doc, ret) => {
        const { password, __v, ...rest } = ret;
        return rest;
    },
});

const User: Model<IUserDocument> = mongoose.model<IUserDocument>('User', userSchema);

export default User;
