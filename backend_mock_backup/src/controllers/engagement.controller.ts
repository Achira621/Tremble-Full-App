import { Request, Response } from 'express';
import { dataStore } from '../data/store';
import { ApiResponse, UserProfile, User } from '../types';
import {
    DailyStreak,
    Achievement,
    Notification,
    SecretAdmirer,
    DailyReward,
    ActivityHighlight,
    UserEngagementStats,
    MysteryBox
} from '../types/engagement';
import { AppError } from '../middleware/errorHandler';
import { ERROR_MESSAGES } from '../utils/constants';
import { generateId } from '../utils/generators';

/**
 * Get user's current streak
 */
export const getDailyStreak = (
    req: Request,
    res: Response<ApiResponse<DailyStreak>>
): void => {
    const userId = req.user!.userId;

    let streak = dataStore.getDailyStreak(userId);

    if (!streak) {
        // Create initial streak
        streak = {
            userId,
            currentStreak: 1,
            longestStreak: 1,
            lastActiveDate: new Date().toISOString().split('T')[0],
            streakRewards: generateStreakRewards(),
        };
        dataStore.setDailyStreak(userId, streak);
    } else {
        // Update streak if user logged in today
        const today = new Date().toISOString().split('T')[0];
        const lastActive = streak.lastActiveDate;

        if (lastActive !== today) {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            if (lastActive === yesterday) {
                // Continue streak
                streak.currentStreak++;
                if (streak.currentStreak > streak.longestStreak) {
                    streak.longestStreak = streak.currentStreak;
                }
            } else {
                // Streak broken
                streak.currentStreak = 1;
            }

            streak.lastActiveDate = today;
            dataStore.setDailyStreak(userId, streak);
        }
    }

    res.json({
        success: true,
        data: streak,
    });
};

/**
 * Claim streak reward
 */
export const claimStreakReward = (
    req: Request,
    res: Response<ApiResponse>
): void => {
    const userId = req.user!.userId;
    const { day } = req.body;

    const streak = dataStore.getDailyStreak(userId);
    if (!streak) {
        throw new AppError('Streak not found', 404);
    }

    if (streak.currentStreak < day) {
        throw new AppError('Streak not reached yet', 400);
    }

    const reward = streak.streakRewards.find(r => r.day === day);
    if (!reward) {
        throw new AppError('Reward not found', 404);
    }

    if (reward.claimed) {
        throw new AppError('Reward already claimed', 400);
    }

    reward.claimed = true;
    reward.claimedAt = new Date();
    dataStore.setDailyStreak(userId, streak);

    // Create notification
    createNotification(userId, {
        type: 'daily_reward',
        title: '🎁 Reward Claimed!',
        message: `You claimed your Day ${day} streak reward: ${reward.reward}`,
    });

    res.json({
        success: true,
        message: 'Reward claimed successfully',
    });
};

/**
 * Get user achievements
 */
export const getAchievements = (
    req: Request,
    res: Response<ApiResponse<Achievement[]>>
): void => {
    const userId = req.user!.userId;
    const achievements = dataStore.getUserAchievements(userId);

    res.json({
        success: true,
        data: achievements,
    });
};

/**
 * Check and unlock achievements
 */
export const checkAchievements = async (userId: string): Promise<void> => {
    const stats = await calculateEngagementStats(userId);
    const currentAchievements = dataStore.getUserAchievements(userId);
    const unlockedTypes = new Set(currentAchievements.map(a => a.type));

    // First Match
    if (stats.totalMatches >= 1 && !unlockedTypes.has('first_match')) {
        unlockAchievement(userId, 'first_match', 'First Match!', 'You got your first match!', '💕');
    }

    // Social Butterfly (10 matches)
    if (stats.totalMatches >= 10 && !unlockedTypes.has('social_butterfly')) {
        unlockAchievement(userId, 'social_butterfly', 'Social Butterfly', 'You have 10 matches!', '🦋');
    }

    // Week Streak
    const streak = dataStore.getDailyStreak(userId);
    if (streak && streak.currentStreak >= 7 && !unlockedTypes.has('week_streak')) {
        unlockAchievement(userId, 'week_streak', 'Week Warrior', '7 day login streak!', '🔥');
    }

    // Popular (50 likes received)
    if (stats.likesReceived >= 50 && !unlockedTypes.has('popular')) {
        unlockAchievement(userId, 'popular', 'Popular!', 'Received 50 likes!', '⭐');
    }
};

/**
 * Get notifications
 */
export const getNotifications = (
    req: Request,
    res: Response<ApiResponse<Notification[]>>
): void => {
    const userId = req.user!.userId;
    const notifications = dataStore.getUserNotifications(userId);

    res.json({
        success: true,
        data: notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    });
};

/**
 * Mark notification as read
 */
export const markNotificationRead = (
    req: Request,
    res: Response<ApiResponse>
): void => {
    const userId = req.user!.userId;
    const { notificationId } = req.params;

    const notification = dataStore.getNotification(notificationId);
    if (!notification || notification.userId !== userId) {
        throw new AppError('Notification not found', 404);
    }

    notification.isRead = true;
    dataStore.updateNotification(notificationId, notification);

    res.json({
        success: true,
    });
};

/**
 * Get secret admirers (who liked/trembled you)
 */
export const getSecretAdmirers = (
    req: Request,
    res: Response<ApiResponse<{ count: number; revealed: SecretAdmirer[]; unrevealed: number }>>
): void => {
    const userId = req.user!.userId;
    const admirers = dataStore.getSecretAdmirers(userId);

    const revealed = admirers.filter(a => a.revealed);
    const unrevealed = admirers.filter(a => !a.revealed).length;

    res.json({
        success: true,
        data: {
            count: admirers.length,
            revealed,
            unrevealed,
        },
    });
};

/**
 * Reveal a secret admirer (costs coins or premium feature)
 */
export const revealSecretAdmirer = (
    req: Request,
    res: Response<ApiResponse<{ admirer: User; action: string }>>
): void => {
    const userId = req.user!.userId;

    const admirers = dataStore.getSecretAdmirers(userId).filter(a => !a.revealed);

    if (admirers.length === 0) {
        throw new AppError('No secret admirers to reveal', 404);
    }

    // Reveal the oldest one
    const admirerToReveal = admirers[0];
    admirerToReveal.revealed = true;
    admirerToReveal.revealedAt = new Date();
    dataStore.updateSecretAdmirer(admirerToReveal.id, admirerToReveal);

    const admirer = dataStore.getUser(admirerToReveal.admirerId);

    // Create exciting notification
    createNotification(userId, {
        type: 'mystery_reveal',
        title: '🎭 Secret Revealed!',
        message: `${admirer?.name} ${admirerToReveal.action === 'tremble' ? 'trembled' : 'liked'} you!`,
        relatedUserId: admirer?.id,
        imageUrl: admirer?.photos[0]?.url,
    });

    res.json({
        success: true,
        data: {
            admirer: admirer!,
            action: admirerToReveal.action,
        },
    });
};

/**
 * Get daily rewards
 */
export const getDailyRewards = (
    req: Request,
    res: Response<ApiResponse<DailyReward[]>>
): void => {
    const userId = req.user!.userId;
    const rewards = dataStore.getDailyRewards(userId);

    res.json({
        success: true,
        data: rewards,
    });
};

/**
 * Get activity highlights (trending profiles, new users, etc.)
 */
export const getActivityHighlights = (
    req: Request,
    res: Response<ApiResponse<ActivityHighlight[]>>
): void => {
    const userId = req.user!.userId;
    const highlights = dataStore.getActivityHighlights(userId);

    res.json({
        success: true,
        data: highlights.filter(h => new Date(h.expiresAt) > new Date()),
    });
};

/**
 * Get mystery boxes
 */
export const getMysteryBoxes = (
    req: Request,
    res: Response<ApiResponse<MysteryBox[]>>
): void => {
    const userId = req.user!.userId;
    const boxes = dataStore.getMysteryBoxes(userId);

    res.json({
        success: true,
        data: boxes.filter(b => !b.revealed && new Date(b.expiresAt) > new Date()),
    });
};

/**
 * Open mystery box
 */
export const openMysteryBox = (
    req: Request,
    res: Response<ApiResponse<{ content: string; reward: any }>>
): void => {
    const userId = req.user!.userId;
    const { boxId } = req.params;

    const box = dataStore.getMysteryBox(boxId);
    if (!box || box.userId !== userId) {
        throw new AppError('Mystery box not found', 404);
    }

    if (box.revealed) {
        throw new AppError('Mystery box already opened', 400);
    }

    box.revealed = true;
    box.revealedAt = new Date();
    dataStore.updateMysteryBox(boxId, box);

    let reward: any = {};

    switch (box.content) {
        case 'match':
            reward = { type: 'New Match', description: 'Check your matches!' };
            break;
        case 'secret_admirer':
            reward = { type: 'Secret Admirer', description: 'Someone likes you!' };
            break;
        case 'boost':
            reward = { type: 'Profile Boost', description: '1 hour visibility boost!' };
            break;
        case 'achievement':
            reward = { type: 'Achievement', description: 'New achievement unlocked!' };
            break;
    }

    createNotification(userId, {
        type: 'mystery_reveal',
        title: '🎁 Mystery Box Opened!',
        message: `You got: ${reward.type}`,
    });

    res.json({
        success: true,
        data: { content: box.content, reward },
    });
};

/**
 * Get engagement stats
 */
export const getEngagementStats = async (
    req: Request,
    res: Response<ApiResponse<UserEngagementStats>>
): Promise<void> => {
    const userId = req.user!.userId;
    const stats = await calculateEngagementStats(userId);

    res.json({
        success: true,
        data: stats,
    });
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateStreakRewards() {
    return [
        { day: 3, reward: 'Free Boost', claimed: false },
        { day: 7, reward: '3 Super Likes', claimed: false },
        { day: 14, reward: 'See Who Liked You', claimed: false },
        { day: 30, reward: 'Premium Day Pass', claimed: false },
    ];
}

function unlockAchievement(userId: string, type: any, title: string, description: string, icon: string) {
    const achievement: Achievement = {
        id: generateId(),
        userId,
        type,
        title,
        description,
        icon,
        unlockedAt: new Date(),
        progress: 100,
        maxProgress: 100,
    };

    dataStore.addAchievement(achievement);

    createNotification(userId, {
        type: 'achievement_unlocked',
        title: '🏆 Achievement Unlocked!',
        message: `${title}: ${description}`,
    });
}

function createNotification(userId: string, data: Partial<Notification>) {
    const notification: Notification = {
        id: generateId(),
        userId,
        type: data.type || 'new_match',
        title: data.title || '',
        message: data.message || '',
        imageUrl: data.imageUrl,
        actionUrl: data.actionUrl,
        relatedUserId: data.relatedUserId,
        isRead: false,
        createdAt: new Date(),
    };

    dataStore.addNotification(notification);
}

async function calculateEngagementStats(userId: string): Promise<UserEngagementStats> {
    const matches = dataStore.getUserMatches(userId);
    const messages = dataStore.getAllMessages().filter(m => m.senderId === userId);
    const connections = dataStore.getUserConnections(userId);
    const streak = dataStore.getDailyStreak(userId);

    const likesReceived = connections.filter(c => c.toUserId === userId && c.action === 'like').length;
    const tremblesReceived = connections.filter(c => c.toUserId === userId && c.action === 'tremble').length;

    return {
        userId,
        dailyLogins: 1,
        weeklyLogins: 7,
        totalMatches: matches.length,
        totalMessages: messages.length,
        profileViews: Math.floor(Math.random() * 100) + 50,
        likesReceived,
        tremblesReceived,
        currentStreak: streak?.currentStreak || 0,
        engagementScore: Math.min(100, (matches.length * 10) + (messages.length * 2) + (streak?.currentStreak || 0) * 5),
        lastActiveAt: new Date(),
    };
}
