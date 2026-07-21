import { Response } from 'express';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';
import cache from '../utils/cache';
import { insforge } from '../config/database';

// @desc    Follow user
// @route   POST /api/connections/follow/:userId
// @access  Private
export const followUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authorized' });
            return;
        }

        const { userId } = req.params;

        // Can't follow yourself
        if (userId === req.user.id) {
            res.status(400).json({ success: false, error: "You can't follow yourself" });
            return;
        }

        // Check if user exists
        const { data: userToFollow, error: userError } = await insforge
            .from('users')
            .select('id')
            .eq('id', userId)
            .single();

        if (userError || !userToFollow) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }

        // Check if already following
        const { data: existingConnection, error: connError } = await insforge
            .from('connections')
            .select('id')
            .eq('follower_id', req.user.id)
            .eq('following_id', userId)
            .single();

        if (existingConnection) {
            res.status(400).json({ success: false, error: 'Already following this user' });
            return;
        }

        // Create connection
        await insforge.from('connections').insert([{
            follower_id: req.user.id,
            following_id: userId,
            status: 'accepted',
        }]);

        // Update counts
        const { data: currentUser } = await insforge.from('users').select('following_count').eq('id', req.user.id).single();
        if (currentUser) {
            await insforge.from('users').update({ following_count: (currentUser.following_count || 0) + 1 }).eq('id', req.user.id);
        }

        const { data: targetUser } = await insforge.from('users').select('followers_count').eq('id', userId).single();
        if (targetUser) {
            await insforge.from('users').update({ followers_count: (targetUser.followers_count || 0) + 1 }).eq('id', userId);
        }

        // Invalidate caches
        await cache.del(`user:${req.user.id}`);
        await cache.del("user: + userId + ");
        await cache.delPattern(`feed:${req.user.id}:*`);

        logger.info(`${req.user.username} followed user ${userId}`);

        res.status(200).json({
            success: true,
            message: 'Successfully followed user',
        });
    } catch (error: any) {
        logger.error('Follow user error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to follow user',
        });
    }
};

// @desc    Unfollow user
// @route   DELETE /api/connections/unfollow/:userId
// @access  Private
export const unfollowUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authorized' });
            return;
        }

        const { userId } = req.params;

        // Delete connection
        const { data: deletedConnections, error: deleteError } = await insforge
            .from('connections')
            .delete()
            .eq('follower_id', req.user.id)
            .eq('following_id', userId)
            .select();

        if (deleteError) throw deleteError;

        if (!deletedConnections || deletedConnections.length === 0) {
            res.status(400).json({ success: false, error: 'Not following this user' });
            return;
        }

        // Update counts
        const { data: currentUser } = await insforge.from('users').select('following_count').eq('id', req.user.id).single();
        if (currentUser) {
            await insforge.from('users').update({ following_count: Math.max(0, (currentUser.following_count || 0) - 1) }).eq('id', req.user.id);
        }

        const { data: targetUser } = await insforge.from('users').select('followers_count').eq('id', userId).single();
        if (targetUser) {
            await insforge.from('users').update({ followers_count: Math.max(0, (targetUser.followers_count || 0) - 1) }).eq('id', userId);
        }

        // Invalidate caches
        await cache.del(`user:${req.user.id}`);
        await cache.del("user: + userId + ");
        await cache.delPattern(`feed:${req.user.id}:*`);

        logger.info(`${req.user.username} unfollowed user ${userId}`);

        res.status(200).json({
            success: true,
            message: 'Successfully unfollowed user',
        });
    } catch (error: any) {
        logger.error('Unfollow user error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to unfollow user',
        });
    }
};

// @desc    Get followers
// @route   GET /api/connections/followers/:userId
// @access  Public
export const getFollowers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const { data: connections, error, count } = await insforge
            .from('connections')
            .select('follower:users!follower_id(id, username, full_name, profile_photo, followers_count)', { count: 'exact' })
            .eq('following_id', userId)
            .eq('status', 'accepted')
            .order('created_at', { ascending: false })
            .range(skip, skip + limit - 1);

        if (error) throw error;

        const total = count || 0;
        const followers = (connections || []).map((c: any) => c.follower);

        res.status(200).json({
            success: true,
            data: {
                followers,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    hasMore: skip + followers.length < total,
                },
            },
        });
    } catch (error: any) {
        logger.error('Get followers error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get followers',
        });
    }
};

// @desc    Get following
// @route   GET /api/connections/following/:userId
// @access  Public
export const getFollowing = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const { data: connections, error, count } = await insforge
            .from('connections')
            .select('following:users!following_id(id, username, full_name, profile_photo, followers_count)', { count: 'exact' })
            .eq('follower_id', userId)
            .eq('status', 'accepted')
            .order('created_at', { ascending: false })
            .range(skip, skip + limit - 1);

        if (error) throw error;

        const total = count || 0;
        const following = (connections || []).map((c: any) => c.following);

        res.status(200).json({
            success: true,
            data: {
                following,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    hasMore: skip + following.length < total,
                },
            },
        });
    } catch (error: any) {
        logger.error('Get following error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get following',
        });
    }
};

export default {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
};
