import { Request } from 'express';

// Extended Express Request with user
export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
        email: string;
    };
}

// User types
export interface IUser {
    _id: string;
    username: string;
    email: string;
    password: string;
    fullName: string;
    bio?: string;
    profilePhoto?: string;
    followers: string[];
    following: string[];
    createdAt: Date;
    updatedAt: Date;
    lastActive: Date;
}

// Post types
export interface IPost {
    _id: string;
    user: string;
    caption: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    location?: string;
    likes: string[];
    likesCount: number;
    commentsCount: number;
    createdAt: Date;
    updatedAt: Date;
}

// Connection types
export interface IConnection {
    _id: string;
    follower: string;
    following: string;
    status: 'pending' | 'accepted' | 'blocked';
    createdAt: Date;
}

// Message types
export interface IMessage {
    _id: string;
    sender: string;
    receiver: string;
    content: string;
    mediaUrl?: string;
    read: boolean;
    createdAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

// Pagination types
export interface PaginationParams {
    page: number;
    limit: number;
    cursor?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        hasMore: boolean;
        nextCursor?: string;
    };
}
