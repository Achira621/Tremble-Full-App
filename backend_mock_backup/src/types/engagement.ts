// ============================================
// ENGAGEMENT & GAMIFICATION TYPES
// ============================================

export interface DailyStreak {
    userId: string;
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string;
    streakRewards: StreakReward[];
}

export interface StreakReward {
    day: number;
    reward: string;
    claimed: boolean;
    claimedAt?: Date;
}

export interface Achievement {
    id: string;
    userId: string;
    type: AchievementType;
    title: string;
    description: string;
    icon: string;
    unlockedAt: Date;
    progress: number;
    maxProgress: number;
}

export type AchievementType =
    | 'first_match'
    | 'first_message'
    | 'photo_pro'
    | 'social_butterfly'
    | 'conversation_starter'
    | 'week_streak'
    | 'month_streak'
    | 'popular'
    | 'explorer'
    | 'heartbreaker';

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    imageUrl?: string;
    actionUrl?: string;
    relatedUserId?: string;
    isRead: boolean;
    createdAt: Date;
}

export type NotificationType =
    | 'new_match'
    | 'new_message'
    | 'someone_trembled_you'
    | 'someone_liked_you'
    | 'profile_view'
    | 'streak_reminder'
    | 'achievement_unlocked'
    | 'daily_reward'
    | 'mystery_reveal';

export interface SecretAdmirer {
    id: string;
    admirerId: string;
    targetUserId: string;
    action: 'like' | 'tremble';
    revealed: boolean;
    createdAt: Date;
    revealedAt?: Date;
}

export interface DailyReward {
    id: string;
    userId: string;
    day: number;
    rewardType: 'boost' | 'super_like' | 'undo' | 'see_who_liked';
    claimed: boolean;
    claimedAt?: Date;
    expiresAt: Date;
}

export interface ActivityHighlight {
    id: string;
    userId: string;
    type: 'trending' | 'hot_profile' | 'new_in_area' | 'mutual_friend';
    priority: number;
    title: string;
    description: string;
    imageUrl?: string;
    actionUserId?: string;
    expiresAt: Date;
    createdAt: Date;
}

export interface UserEngagementStats {
    userId: string;
    dailyLogins: number;
    weeklyLogins: number;
    totalMatches: number;
    totalMessages: number;
    profileViews: number;
    likesReceived: number;
    tremblesReceived: number;
    currentStreak: number;
    engagementScore: number; // 0-100
    lastActiveAt: Date;
}

export interface MysteryBox {
    id: string;
    userId: string;
    content: 'match' | 'secret_admirer' | 'boost' | 'achievement';
    revealed: boolean;
    revealedAt?: Date;
    createdAt: Date;
    expiresAt: Date;
}
