import { Request, Response } from 'express';
import { dataStore } from '../data/store';
import { ApiResponse, VibeBadge, VibeType } from '../types';
import { AppError } from '../middleware/errorHandler';
import { ERROR_MESSAGES, VIBE_BADGES } from '../utils/constants';
import { generateId } from '../utils/generators';

/**
 * Get user's vibe badges
 */
export const getUserVibes = (
    req: Request,
    res: Response<ApiResponse<VibeBadge[]>>
): void => {
    const { userId } = req.params;

    const user = dataStore.getUser(userId);
    if (!user) {
        throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 404);
    }

    const vibeBadges = dataStore.getUserVibeBadges(userId);

    res.json({
        success: true,
        data: vibeBadges,
    });
};

/**
 * Generate vibe badges for a user based on their interests and posts
 */
export const generateVibes = (
    req: Request,
    res: Response<ApiResponse<VibeBadge[]>>
): void => {
    const userId = req.user!.userId;

    const user = dataStore.getUser(userId);
    if (!user) {
        throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 404);
    }

    const posts = dataStore.getUserPosts(userId);

    // Simple rule-based vibe generation
    const vibes: VibeBadge[] = [];

    // Interest-based vibes
    const interestVibeMap: Record<string, VibeType> = {
        'Art': 'Artsy',
        'Photography': 'Artsy',
        'Sports': 'Sporty',
        'Fitness': 'Fitness Junkie',
        'Travel': 'Traveller',
        'Food': 'Foodie',
        'Cooking': 'Foodie',
        'Coffee': 'Coffee Lover',
        'Nature': 'Nature Lover',
        'Hiking': 'Adventure Seeker',
        'Music': 'Music Enthusiast',
        'Reading': 'Bookworm',
        'Technology': 'Tech Geek',
        'Gaming': 'Tech Geek',
        'Fashion': 'Fashion Forward',
        'Yoga': 'Fitness Junkie',
    };

    user.interests.forEach(interest => {
        const vibeType = interestVibeMap[interest];
        if (vibeType && !vibes.find(v => v.badge === vibeType)) {
            vibes.push({
                id: generateId(),
                userId,
                badge: vibeType,
                confidence: 0.8,
                generatedAt: new Date(),
            });
        }
    });

    // Add "Creative Soul" if user has many posts
    if (posts.length >= 5 && !vibes.find(v => v.badge === 'Creative Soul')) {
        vibes.push({
            id: generateId(),
            userId,
            badge: 'Creative Soul',
            confidence: 0.7,
            generatedAt: new Date(),
        });
    }

    // Add "Minimal" if user has few interests
    if (user.interests.length <= 3 && !vibes.find(v => v.badge === 'Minimal')) {
        vibes.push({
            id: generateId(),
            userId,
            badge: 'Minimal',
            confidence: 0.6,
            generatedAt: new Date(),
        });
    }

    // Limit to top 3 vibes
    const topVibes = vibes.slice(0, 3);

    // Update user's vibe badges
    dataStore.setUserVibeBadges(userId, topVibes);
    dataStore.updateUser(userId, { vibeBadges: topVibes.map(v => v.badge) });

    res.json({
        success: true,
        data: topVibes,
    });
};
