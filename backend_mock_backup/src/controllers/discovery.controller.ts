import { Request, Response } from 'express';
import { dataStore } from '../data/store';
import { ApiResponse, DiscoveryCard, UserProfile, User, PaginatedResponse } from '../types';
import { AppError } from '../middleware/errorHandler';
import { ERROR_MESSAGES, APP_CONSTANTS } from '../utils/constants';
import { calculateMatchScore, findCommonInterests, shuffleArray } from '../utils/generators';

/**
 * Convert User to UserProfile
 */
const toUserProfile = (user: User): UserProfile => {
    return {
        id: user.id,
        name: user.name,
        age: user.age,
        bio: user.bio,
        photos: user.photos,
        interests: user.interests,
        vibeBadges: user.vibeBadges,
        location: user.location?.enabled ? { city: user.location.city } : undefined,
    };
};

/**
 * Get discovery feed
 */
export const getDiscoveryFeed = (
    req: Request,
    res: Response<ApiResponse<PaginatedResponse<DiscoveryCard>>>
): void => {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, APP_CONSTANTS.MAX_PAGE_SIZE);

    const currentUser = dataStore.getUser(userId);
    if (!currentUser) {
        throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 404);
    }

    // No daily discovery limit - users can browse freely all day!

    // Get all users except current user
    const allUsers = dataStore.getAllUsers().filter(u => u.id !== userId);

    // Get users already seen (connections)
    const connections = dataStore.getUserConnections(userId);
    const seenUserIds = new Set(
        connections.map(c => c.fromUserId === userId ? c.toUserId : c.fromUserId)
    );

    // Get blocked users
    const blockedUsers = dataStore.getBlockedUsers(userId);
    const blockedUserIds = new Set(blockedUsers.map(b => b.blockedUserId));

    // Filter out seen and blocked users
    let candidates = allUsers.filter(
        u => !seenUserIds.has(u.id) && !blockedUserIds.has(u.id) && !dataStore.isUserBlocked(userId, u.id)
    );

    // Calculate match scores
    const scoredCandidates = candidates.map(user => {
        const commonInterests = findCommonInterests(currentUser.interests, user.interests);
        const matchScore = calculateMatchScore(currentUser.interests, user.interests);

        return {
            user: toUserProfile(user),
            commonInterests,
            matchScore,
        };
    });

    // Sort by match score (higher first) and shuffle within score groups for variety
    scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = scoredCandidates.slice(startIndex, endIndex);

    // No tracking needed - unlimited discovery!

    res.json({
        success: true,
        data: {
            data: paginatedResults,
            page,
            limit,
            total: scoredCandidates.length,
            hasMore: endIndex < scoredCandidates.length,
        },
    });
};

/**
 * Refresh discovery pool (resets daily limit - for testing)
 */
export const refreshDiscovery = (
    req: Request,
    res: Response<ApiResponse>
): void => {
    const userId = req.user!.userId;

    // In a real app, this would be handled by a cron job
    // For now, we'll just return success

    res.json({
        success: true,
        message: 'Discovery pool refreshed',
    });
};

/**
 * Update discovery preferences
 */
export const updatePreferences = (
    req: Request,
    res: Response<ApiResponse>
): void => {
    const userId = req.user!.userId;
    const { ageRange, maxDistance, interests } = req.body;

    const prefs = {
        userId,
        ageRange: ageRange || { min: APP_CONSTANTS.MIN_AGE, max: APP_CONSTANTS.MAX_AGE },
        maxDistance,
        interests: interests || [],
        updatedAt: new Date(),
    };

    dataStore.setDiscoveryPreferences(prefs);

    res.json({
        success: true,
        message: 'Discovery preferences updated',
    });
};
