import { Request, Response } from 'express';
import { dataStore } from '../data/store';
import { ApiResponse, Report, BlockedUser, UserProfile, User } from '../types';
import { AppError } from '../middleware/errorHandler';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import { generateId } from '../utils/generators';

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
 * Report a user or content
 */
export const reportUser = (
    req: Request,
    res: Response<ApiResponse>
): void => {
    const reporterId = req.user!.userId;
    const { reportedUserId, reportedPostId, reason, description } = req.body;

    if (!reportedUserId && !reportedPostId) {
        throw new AppError('Either reportedUserId or reportedPostId is required', 400);
    }

    const report: Report = {
        id: generateId(),
        reporterId,
        reportedUserId,
        reportedPostId,
        reason,
        description: description || '',
        status: 'pending',
        createdAt: new Date(),
    };

    dataStore.createReport(report);

    res.json({
        success: true,
        message: SUCCESS_MESSAGES.REPORT_SUBMITTED,
    });
};

/**
 * Block a user
 */
export const blockUser = (
    req: Request,
    res: Response<ApiResponse>
): void => {
    const userId = req.user!.userId;
    const { blockedUserId } = req.body;

    if (userId === blockedUserId) {
        throw new AppError('Cannot block yourself', 400);
    }

    const blockedUser = dataStore.getUser(blockedUserId);
    if (!blockedUser) {
        throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 404);
    }

    // Check if already blocked
    if (dataStore.isUserBlocked(userId, blockedUserId)) {
        throw new AppError('User already blocked', 400);
    }

    const block: BlockedUser = {
        id: generateId(),
        userId,
        blockedUserId,
        createdAt: new Date(),
    };

    dataStore.blockUser(block);

    res.json({
        success: true,
        message: SUCCESS_MESSAGES.USER_BLOCKED,
    });
};

/**
 * Unblock a user
 */
export const unblockUser = (
    req: Request,
    res: Response<ApiResponse>
): void => {
    const userId = req.user!.userId;
    const { blockedUserId } = req.params;

    const success = dataStore.unblockUser(userId, blockedUserId);

    if (!success) {
        throw new AppError('User not blocked', 404);
    }

    res.json({
        success: true,
        message: SUCCESS_MESSAGES.USER_UNBLOCKED,
    });
};

/**
 * Get blocked users
 */
export const getBlockedUsers = (
    req: Request,
    res: Response<ApiResponse<Array<{ block: BlockedUser; user: UserProfile }>>>
): void => {
    const userId = req.user!.userId;

    const blockedUsers = dataStore.getBlockedUsers(userId);

    const blockedWithUsers = blockedUsers.map(block => {
        const user = dataStore.getUser(block.blockedUserId);
        return {
            block,
            user: user ? toUserProfile(user) : null,
        };
    }).filter(b => b.user !== null) as Array<{ block: BlockedUser; user: UserProfile }>;

    res.json({
        success: true,
        data: blockedWithUsers,
    });
};
