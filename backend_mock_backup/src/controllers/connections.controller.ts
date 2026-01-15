import { Request, Response } from 'express';
import { dataStore } from '../data/store';
import { ApiResponse, Connection, Match, UserProfile, User } from '../types';
import { AppError } from '../middleware/errorHandler';
import { ERROR_MESSAGES } from '../utils/constants';
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
 * Like a user
 */
export const likeUser = (
    req: Request,
    res: Response<ApiResponse<{ matched: boolean; match?: Match }>>
): void => {
    const userId = req.user!.userId;
    const { targetUserId } = req.body;

    if (userId === targetUserId) {
        throw new AppError(ERROR_MESSAGES.CANNOT_CONNECT_SELF, 400);
    }

    const targetUser = dataStore.getUser(targetUserId);
    if (!targetUser) {
        throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 404);
    }

    // Check if already connected
    const existing = dataStore.getConnectionBetweenUsers(userId, targetUserId);
    if (existing) {
        throw new AppError(ERROR_MESSAGES.ALREADY_CONNECTED, 400);
    }

    // Create like connection
    const connection: Connection = {
        id: generateId(),
        fromUserId: userId,
        toUserId: targetUserId,
        action: 'like',
        status: 'pending',
        createdAt: new Date(),
        lastInteractionAt: new Date(),
    };
    dataStore.createConnection(connection);

    // Check for mutual like
    const reverseConnection = dataStore.getConnectionBetweenUsers(targetUserId, userId);
    let matched = false;
    let match: Match | undefined;

    if (reverseConnection && (reverseConnection.action === 'like' || reverseConnection.action === 'tremble')) {
        // Create match
        match = {
            id: generateId(),
            user1Id: userId,
            user2Id: targetUserId,
            matchedAt: new Date(),
            conversationId: generateId(),
            isActive: true,
        };
        dataStore.createMatch(match);

        // Update connection statuses
        dataStore.updateConnection(connection.id, { status: 'matched' });
        dataStore.updateConnection(reverseConnection.id, { status: 'matched' });

        // Create conversation
        dataStore.createConversation({
            id: match.conversationId,
            user1Id: userId,
            user2Id: targetUserId,
            matchId: match.id,
            unreadCount: { [userId]: 0, [targetUserId]: 0 },
            createdAt: new Date(),
        });

        matched = true;
    }

    res.json({
        success: true,
        data: { matched, match },
    });
};

/**
 * Pass on a user
 */
export const passUser = (
    req: Request,
    res: Response<ApiResponse>
): void => {
    const userId = req.user!.userId;
    const { targetUserId } = req.body;

    if (userId === targetUserId) {
        throw new AppError(ERROR_MESSAGES.CANNOT_CONNECT_SELF, 400);
    }

    const targetUser = dataStore.getUser(targetUserId);
    if (!targetUser) {
        throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 404);
    }

    // Create pass connection
    const connection: Connection = {
        id: generateId(),
        fromUserId: userId,
        toUserId: targetUserId,
        action: 'pass',
        status: 'pending',
        createdAt: new Date(),
        lastInteractionAt: new Date(),
    };
    dataStore.createConnection(connection);

    res.json({
        success: true,
        message: 'User passed',
    });
};

/**
 * Tremble a user (super like / connection request)
 */
export const trembleUser = (
    req: Request,
    res: Response<ApiResponse<{ matched: boolean; match?: Match }>>
): void => {
    const userId = req.user!.userId;
    const { targetUserId } = req.body;

    if (userId === targetUserId) {
        throw new AppError(ERROR_MESSAGES.CANNOT_CONNECT_SELF, 400);
    }

    const targetUser = dataStore.getUser(targetUserId);
    if (!targetUser) {
        throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 404);
    }

    // Check if already connected
    const existing = dataStore.getConnectionBetweenUsers(userId, targetUserId);
    if (existing) {
        throw new AppError(ERROR_MESSAGES.ALREADY_CONNECTED, 400);
    }

    // Create tremble connection
    const connection: Connection = {
        id: generateId(),
        fromUserId: userId,
        toUserId: targetUserId,
        action: 'tremble',
        status: 'pending',
        createdAt: new Date(),
        lastInteractionAt: new Date(),
    };
    dataStore.createConnection(connection);

    // Check for mutual tremble or like
    const reverseConnection = dataStore.getConnectionBetweenUsers(targetUserId, userId);
    let matched = false;
    let match: Match | undefined;

    if (reverseConnection && (reverseConnection.action === 'like' || reverseConnection.action === 'tremble')) {
        // Create match
        match = {
            id: generateId(),
            user1Id: userId,
            user2Id: targetUserId,
            matchedAt: new Date(),
            conversationId: generateId(),
            isActive: true,
        };
        dataStore.createMatch(match);

        // Update connection statuses
        dataStore.updateConnection(connection.id, { status: 'matched' });
        dataStore.updateConnection(reverseConnection.id, { status: 'matched' });

        // Create conversation
        dataStore.createConversation({
            id: match.conversationId,
            user1Id: userId,
            user2Id: targetUserId,
            matchId: match.id,
            unreadCount: { [userId]: 0, [targetUserId]: 0 },
            createdAt: new Date(),
        });

        matched = true;
    }

    res.json({
        success: true,
        data: { matched, match },
    });
};

/**
 * Get user's matches
 */
export const getMatches = (
    req: Request,
    res: Response<ApiResponse<Array<{ match: Match; user: UserProfile }>>>
): void => {
    const userId = req.user!.userId;

    const matches = dataStore.getUserMatches(userId);

    const matchesWithUsers = matches.map(match => {
        const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
        const otherUser = dataStore.getUser(otherUserId);

        return {
            match,
            user: otherUser ? toUserProfile(otherUser) : null,
        };
    }).filter(m => m.user !== null) as Array<{ match: Match; user: UserProfile }>;

    res.json({
        success: true,
        data: matchesWithUsers,
    });
};

/**
 * Unmatch / remove connection
 */
export const unmatch = (
    req: Request,
    res: Response<ApiResponse>
): void => {
    const userId = req.user!.userId;
    const { matchId } = req.params;

    const match = dataStore.getMatch(matchId);
    if (!match) {
        throw new AppError(ERROR_MESSAGES.CONNECTION_NOT_FOUND, 404);
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
        throw new AppError(ERROR_MESSAGES.FORBIDDEN, 403);
    }

    // Deactivate match
    dataStore.updateMatch(matchId, { isActive: false });

    res.json({
        success: true,
        message: 'Unmatched successfully',
    });
};
