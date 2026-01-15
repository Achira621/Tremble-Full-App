// ============================================
// GLIMPSES TYPES (Reels-like Photo Feed)
// ============================================

export interface Glimpse {
    id: string;
    userId: string;
    photoUrl: string;
    caption?: string;
    mood?: MoodType;
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
    shares: number;
    createdAt: Date;
    expiresAt?: Date; // Optional 24-48 hour expiry
    isActive: boolean;
}

export type MoodType =
    | 'vibing'
    | 'exploring'
    | 'chilling'
    | 'party'
    | 'romantic'
    | 'adventurous'
    | 'creative'
    | 'peaceful'
    | 'energetic'
    | 'mysterious';

export interface GlimpseInteraction {
    id: string;
    glimpseId: string;
    userId: string;
    type: InteractionType;
    createdAt: Date;
}

export type InteractionType = 'view' | 'like' | 'comment' | 'share' | 'skip' | 'tremble';

export interface GlimpseComment {
    id: string;
    glimpseId: string;
    userId: string;
    content: string;
    createdAt: Date;
}

export interface GlimpseFeedItem {
    glimpse: Glimpse;
    user: {
        id: string;
        name: string;
        age: number;
        photos: any[];
        vibeBadges: string[];
        isVerified?: boolean;
    };
    hasLiked: boolean;
    hasTrembled: boolean;
    commonInterests: string[];
    matchScore: number;
}

export interface GlimpseAlgorithmSettings {
    userId: string;
    preferredMoods: MoodType[];
    preferredTags: string[];
    ageRange: { min: number; max: number };
    maxDistance?: number;
    showOnlyNewFaces: boolean;
    prioritizeHighEngagement: boolean;
}

export interface GlimpseStats {
    glimpseId: string;
    totalViews: number;
    uniqueViews: number;
    likes: number;
    comments: number;
    shares: number;
    trembles: number;
    averageWatchTime: number; // in seconds
    engagementRate: number; // percentage
}
