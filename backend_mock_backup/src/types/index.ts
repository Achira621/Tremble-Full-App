// ============================================
// USER & PROFILE TYPES
// ============================================

export interface User {
    id: string;
    email: string;
    username: string;
    passwordHash: string;
    name: string;
    age: number;
    bio: string;
    photos: UserPhoto[];
    interests: string[];
    location?: {
        city?: string;
        radiusKm?: number;
        enabled: boolean;
    };
    settings: UserSettings;
    vibeBadges: string[];
    createdAt: Date;
    updatedAt: Date;
    lastActive: Date;
}

export interface UserPhoto {
    id: string;
    url: string;
    order: number;
    uploadedAt: Date;
}

export interface UserSettings {
    privacyMode: 'public' | 'private';
    showLocation: boolean;
    showAge: boolean;
    discoveryEnabled: boolean;
    notificationsEnabled: boolean;
    emailNotifications: boolean;
}

export interface UserProfile {
    id: string;
    name: string;
    age: number;
    bio: string;
    photos: UserPhoto[];
    interests: string[];
    vibeBadges: string[];
    location?: {
        city?: string;
    };
}

// ============================================
// POST & CONTENT TYPES
// ============================================

export interface Post {
    id: string;
    userId: string;
    photoUrl: string;
    caption: string;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// CONNECTION & MATCHING TYPES
// ============================================

export type ConnectionAction = 'like' | 'pass' | 'tremble';
export type ConnectionStatus = 'pending' | 'matched' | 'archived';

export interface Connection {
    id: string;
    fromUserId: string;
    toUserId: string;
    action: ConnectionAction;
    status: ConnectionStatus;
    createdAt: Date;
    lastInteractionAt: Date;
}

export interface Match {
    id: string;
    user1Id: string;
    user2Id: string;
    matchedAt: Date;
    conversationId: string;
    isActive: boolean;
    lastMessageAt?: Date;
}

// ============================================
// MESSAGING TYPES
// ============================================

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
}

export interface Conversation {
    id: string;
    user1Id: string;
    user2Id: string;
    matchId: string;
    lastMessageAt?: Date;
    unreadCount: {
        [userId: string]: number;
    };
    createdAt: Date;
}

export interface IcebreakerPrompt {
    id: string;
    text: string;
    category: 'fun' | 'deep' | 'casual' | 'creative';
}

// ============================================
// DISCOVERY TYPES
// ============================================

export interface DiscoveryPreferences {
    userId: string;
    ageRange: {
        min: number;
        max: number;
    };
    maxDistance?: number;
    interests: string[];
    updatedAt: Date;
}

export interface DiscoveryCard {
    user: UserProfile;
    commonInterests: string[];
    matchScore: number;
}

// ============================================
// VIBE BADGE TYPES
// ============================================

export interface VibeBadge {
    id: string;
    userId: string;
    badge: string;
    confidence: number;
    generatedAt: Date;
}

export type VibeType =
    | 'Artsy'
    | 'Minimal'
    | 'Sporty'
    | 'Traveller'
    | 'Foodie'
    | 'Coffee Lover'
    | 'Nature Lover'
    | 'Music Enthusiast'
    | 'Bookworm'
    | 'Tech Geek'
    | 'Fashion Forward'
    | 'Fitness Junkie'
    | 'Creative Soul'
    | 'Adventure Seeker';

// ============================================
// SAFETY & MODERATION TYPES
// ============================================

export type ReportReason =
    | 'harassment'
    | 'inappropriate_content'
    | 'spam'
    | 'fake_profile'
    | 'underage'
    | 'other';

export interface Report {
    id: string;
    reporterId: string;
    reportedUserId?: string;
    reportedPostId?: string;
    reason: ReportReason;
    description: string;
    status: 'pending' | 'reviewed' | 'resolved';
    createdAt: Date;
    resolvedAt?: Date;
}

export interface BlockedUser {
    id: string;
    userId: string;
    blockedUserId: string;
    createdAt: Date;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface RegisterRequest {
    email: string;
    username: string;
    password: string;
    name: string;
    age: number;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: UserProfile;
    token: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
}

// ============================================
// JWT PAYLOAD TYPE
// ============================================

export interface JwtPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}

// ============================================
// STATISTICS TYPES
// ============================================

export interface UserStats {
    likesGiven: number;
    likesReceived: number;
    tremblesGiven: number;
    tremblesReceived: number;
    matches: number;
    postsCount: number;
}
