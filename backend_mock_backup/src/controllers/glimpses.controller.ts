import { Request, Response } from 'express';
import { dataStore } from '../data/store';
import { ApiResponse, User } from '../types';
import { Glimpse, GlimpseFeedItem, GlimpseInteraction, GlimpseComment, GlimpseStats } from '../types/glimpses';
import { AppError } from '../middleware/errorHandler';
import { ERROR_MESSAGES } from '../utils/constants';
import { generateId } from '../utils/generators';

/**
 * Create a new Glimpse
 */
export const createGlimpse = (
    req: Request,
    res: Response<ApiResponse<Glimpse>>
): void => {
    const userId = req.user!.userId;
    const { photoUrl, caption, mood, location, musicTrack, tags, expiryHours } = req.body;

    const glimpse: Glimpse = {
        id: generateId(),
        userId,
        photoUrl,
        caption: caption || '',
        mood: mood || 'vibing',
        location,
        musicTrack,
        tags: tags || [],
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date(),
        expiresAt: expiryHours ? new Date(Date.now() + expiryHours * 60 * 60 * 1000) : undefined,
        isActive: true,
    };

    dataStore.createGlimpse(glimpse);

    res.status(201).json({
        success: true,
        message: 'Glimpse created successfully',
        data: glimpse,
    });
};

/**
 * Get infinite scroll feed (algorithm-driven)
 */
export const getGlimpsesFeed = (
    req: Request,
    res: Response<ApiResponse<GlimpseFeedItem[]>>
): void => {
    const userId = req.user!.userId;
    const { cursor, limit = 20 } = req.query;

    const currentUser = dataStore.getUser(userId);
    if (!currentUser) {
        throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 404);
    }

    // Get all active glimpses
    const allGlimpses = dataStore.getAllGlimpses().filter(g => {
        // Filter expired glimpses
        if (g.expiresAt && new Date(g.expiresAt) < new Date()) {
            return false;
        }
        // Filter user's own glimpses
        if (g.userId === userId) {
            return false;
        }
        // Filter blocked users
        if (dataStore.isUserBlocked(userId, g.userId)) {
            return false;
        }
        return g.isActive;
    });

    // Get user's interaction history
    const interactions = dataStore.getUserGlimpseInteractions(userId);
    const viewedGlimpseIds = new Set(
        interactions.filter(i => i.type === 'view').map(i => i.glimpseId)
    );

    // Algorithm: Score each glimpse
    const scoredGlimpses = allGlimpses.map(glimpse => {
        const glimpseUser = dataStore.getUser(glimpse.userId);
        if (!glimpseUser) return null;

        // Calculate match score
        const commonInterests = currentUser.interests.filter(i =>
            glimpseUser.interests.includes(i)
        );
        const matchScore = commonInterests.length > 0
            ? (commonInterests.length / currentUser.interests.length) * 100
            : 0;

        // Engagement score (virality)
        const engagementScore = (glimpse.likes * 2) + glimpse.comments + (glimpse.views * 0.1);

        // Freshness score (newer = higher)
        const hoursSinceCreated = (Date.now() - glimpse.createdAt.getTime()) / (1000 * 60 * 60);
        const freshnessScore = Math.max(0, 100 - hoursSinceCreated * 5);

        // Already viewed penalty
        const viewPenalty = viewedGlimpseIds.has(glimpse.id) ? -1000 : 0;

        // Algorithm weights
        const totalScore =
            (matchScore * 0.4) +
            (engagementScore * 0.3) +
            (freshnessScore * 0.3) +
            viewPenalty;

        const hasLiked = interactions.some(i => i.glimpseId === glimpse.id && i.type === 'like');
        const hasTrembled = interactions.some(i => i.glimpseId === glimpse.id && i.type === 'tremble');

        return {
            glimpse,
            user: {
                id: glimpseUser.id,
                name: glimpseUser.name,
                age: glimpseUser.age,
                photos: glimpseUser.photos,
                vibeBadges: glimpseUser.vibeBadges,
            },
            hasLiked,
            hasTrembled,
            commonInterests,
            matchScore: Math.round(matchScore),
            _score: totalScore,
        };
    }).filter(item => item !== null) as (GlimpseFeedItem & { _score: number })[];

    // Sort by algorithm score
    scoredGlimpses.sort((a, b) => b._score - a._score);

    // Remove score from response
    const feedItems = scoredGlimpses.map(({ _score, ...item }) => item);

    // Pagination
    const limitNum = Math.min(parseInt(limit as string) || 20, 50);
    const paginatedItems = feedItems.slice(0, limitNum);

    res.json({
        success: true,
        data: paginatedItems,
    });
};

/**
 * Record view interaction (auto-called when glimpse is viewed)
 */
export const recordView = (
    req: Request,
    res: Response<ApiResponse>
): void => {
    const userId = req.user!.userId;
    const { glimpseId } = req.params;
    const { watchTime } = req.body; // in seconds

    const glimpse = dataStore.getGlimpse(glimpseId);
    if (!glimpse) {
        throw new AppError('Glimpse not found', 404);
    }

    // Check if already viewed
    const existingView = dataStore.getUserGlimpseInteractions(userId)
        .find(i => i.glimpseId === glimpseId && i.type === 'view');

    if (!existingView) {
        // Record new view
        const interaction: GlimpseInteraction = {
            id: generateId(),
            glimpseId,
            userId,
            type: 'view',
            createdAt: new Date(),
        };
        dataStore.createGlimpseInteraction(interaction);

        // Increment view count
        glimpse.views++;
        dataStore.updateGlimpse(glimpseId, glimpse);
    }

    res.json({
        success: true,
    });
};

/**
 * Like a glimpse
 */
export const likeGlimpse = (
    req: Request,
    res: Response<ApiResponse>
): void => {
    const userId = req.user!.userId;
    const { glimpseId } = req.params;

    const glimpse = dataStore.getGlimpse(glimpseId);
    if (!glimpse) {
        throw new AppError('Glimpse not found', 404);
    }

    // Check if already liked
    const existingLike = dataStore.getUserGlimpseInteractions(userId)
        .find(i => i.glimpseId === glimpseId && i.type === 'like');

    if (existingLike) {
        // Unlike
        dataStore.deleteGlimpseInteraction(existingLike.id);
        glimpse.likes = Math.max(0, glimpse.likes - 1);
    } else {
        // Like
        const interaction: GlimpseInteraction = {
            id: generateId(),
            glimpseId,
            userId,
            type: 'like',
            createdAt: new Date(),
        };
        dataStore.createGlimpseInteraction(interaction);
        glimpse.likes++;

        // Create notification for glimpse creator
        if (glimpse.userId !== userId) {
            dataStore.addNotification({
                id: generateId(),
                userId: glimpse.userId,
                type: 'someone_liked_you',
                title: '❤️ New Like on Glimpse',
                message: `Someone liked your glimpse!`,
                relatedUserId: userId,
                imageUrl: glimpse.photoUrl,
                isRead: false,
                createdAt: new Date(),
            });
        }
    }

    dataStore.updateGlimpse(glimpseId, glimpse);

    res.json({
        success: true,
        data: { liked: !existingLike, totalLikes: glimpse.likes },
    });
};

/**
 * Tremble on a glimpse (super like + instant match attempt)
 */
export const trembleGlimpse = (
    req: Request,
    res: Response<ApiResponse<{ matched: boolean }>>
): void => {
    const userId = req.user!.userId;
    const { glimpseId } = req.params;

    const glimpse = dataStore.getGlimpse(glimpseId);
    if (!glimpse) {
        throw new AppError('Glimpse not found', 404);
    }

    const interaction: GlimpseInteraction = {
        id: generateId(),
        glimpseId,
        userId,
        type: 'tremble',
        createdAt: new Date(),
    };
    dataStore.createGlimpseInteraction(interaction);

    // Try to create connection
    const targetUserId = glimpse.userId;

    // Check if already connected
    const existingConnection = dataStore.getConnectionBetweenUsers(userId, targetUserId);

    if (!existingConnection) {
        dataStore.createConnection({
            id: generateId(),
            fromUserId: userId,
            toUserId: targetUserId,
            action: 'tremble',
            status: 'pending',
            createdAt: new Date(),
            lastInteractionAt: new Date(),
        });

        // Create notification
        dataStore.addNotification({
            id: generateId(),
            userId: targetUserId,
            type: 'someone_trembled_you',
            title: '💜 Someone Trembled Your Glimpse!',
            message: `Check out who trembled your glimpse!`,
            relatedUserId: userId,
            imageUrl: glimpse.photoUrl,
            isRead: false,
            createdAt: new Date(),
        });
    }

    res.json({
        success: true,
        data: { matched: false }, // Would check for mutual match in real impl
    });
};

/**
 * Add comment to glimpse
 */
export const commentOnGlimpse = (
    req: Request,
    res: Response<ApiResponse<GlimpseComment>>
): void => {
    const userId = req.user!.userId;
    const { glimpseId } = req.params;
    const { content } = req.body;

    const glimpse = dataStore.getGlimpse(glimpseId);
    if (!glimpse) {
        throw new AppError('Glimpse not found', 404);
    }

    const comment: GlimpseComment = {
        id: generateId(),
        glimpseId,
        userId,
        content,
        createdAt: new Date(),
    };

    dataStore.createGlimpseComment(comment);
    glimpse.comments++;
    dataStore.updateGlimpse(glimpseId, glimpse);

    // Create notification
    if (glimpse.userId !== userId) {
        dataStore.addNotification({
            id: generateId(),
            userId: glimpse.userId,
            type: 'new_message',
            title: '💬 New Comment',
            message: `Someone commented on your glimpse!`,
            relatedUserId: userId,
            imageUrl: glimpse.photoUrl,
            isRead: false,
            createdAt: new Date(),
        });
    }

    res.json({
        success: true,
        data: comment,
    });
};

/**
 * Get glimpse stats (for creator)
 */
export const getGlimpseStats = (
    req: Request,
    res: Response<ApiResponse<GlimpseStats>>
): void => {
    const userId = req.user!.userId;
    const { glimpseId } = req.params;

    const glimpse = dataStore.getGlimpse(glimpseId);
    if (!glimpse) {
        throw new AppError('Glimpse not found', 404);
    }

    if (glimpse.userId !== userId) {
        throw new AppError(ERROR_MESSAGES.FORBIDDEN, 403);
    }

    const interactions = dataStore.getGlimpseInteractions(glimpseId);
    const uniqueViews = new Set(interactions.filter(i => i.type === 'view').map(i => i.userId)).size;
    const trembles = interactions.filter(i => i.type === 'tremble').length;

    const engagementRate = glimpse.views > 0
        ? ((glimpse.likes + glimpse.comments + trembles) / glimpse.views) * 100
        : 0;

    const stats: GlimpseStats = {
        glimpseId: glimpse.id,
        totalViews: glimpse.views,
        uniqueViews,
        likes: glimpse.likes,
        comments: glimpse.comments,
        shares: glimpse.shares,
        trembles,
        averageWatchTime: 3.5, // Mock value
        engagementRate: Math.round(engagementRate * 100) / 100,
    };

    res.json({
        success: true,
        data: stats,
    });
};

/**
 * Get user's own glimpses
 */
export const getMyGlimpses = (
    req: Request,
    res: Response<ApiResponse<Glimpse[]>>
): void => {
    const userId = req.user!.userId;
    const glimpses = dataStore.getUserGlimpses(userId);

    res.json({
        success: true,
        data: glimpses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    });
};

/**
 * Delete glimpse
 */
export const deleteGlimpse = (
    req: Request,
    res: Response<ApiResponse>
): void => {
    const userId = req.user!.userId;
    const { glimpseId } = req.params;

    const glimpse = dataStore.getGlimpse(glimpseId);
    if (!glimpse) {
        throw new AppError('Glimpse not found', 404);
    }

    if (glimpse.userId !== userId) {
        throw new AppError(ERROR_MESSAGES.FORBIDDEN, 403);
    }

    dataStore.deleteGlimpse(glimpseId);

    res.json({
        success: true,
        message: 'Glimpse deleted successfully',
    });
};
