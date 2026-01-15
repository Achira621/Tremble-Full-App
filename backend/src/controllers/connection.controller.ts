import { Response } from 'express';
import Connection from '../models/Connection';
import User from '../models/User';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';
import cache from '../utils/cache';

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
        const userToFollow = await User.findById(userId);
        if (!userToFollow) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }

        // Check if already following
        const existingConnection = await Connection.findOne({
            follower: req.user.id,
            following: userId,
        });

        if (existingConnection) {
            res.status(400).json({ success: false, error: 'Already following this user' });
            return;
        }

        // Create connection
        await Connection.create({
            follower: req.user.id,
            following: userId,
            status: 'accepted',
        });

        // Update counts
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { followingCount: 1 },
            $addToSet: { following: userId },
        });

        await User.findByIdAndUpdate(userId, {
            $inc: { followersCount: 1 },
            $addToSet: { followers: req.user.id },
        });

        // Invalidate caches
        await cache.del(`user:${req.user.id}`);
        await cache.del(`user:${userId}`);
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
        const connection = await Connection.findOneAndDelete({
            follower: req.user.id,
            following: userId,
        });

        if (!connection) {
            res.status(400).json({ success: false, error: 'Not following this user' });
            return;
        }

        // Update counts
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { followingCount: -1 },
            $pull: { following: userId },
        });

        await User.findByIdAndUpdate(userId, {
            $inc: { followersCount: -1 },
            $pull: { followers: req.user.id },
        });

        // Invalidate caches
        await cache.del(`user:${req.user.id}`);
        await cache.del(`user:${userId}`);
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

        const connections = await Connection.find({
            following: userId,
            status: 'accepted',
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('follower', 'username fullName profilePhoto followersCount')
            .lean();

        const total = await Connection.countDocuments({
            following: userId,
            status: 'accepted',
        });

        const followers = connections.map((c: any) => c.follower);

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

        const connections = await Connection.find({
            follower: userId,
            status: 'accepted',
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('following', 'username fullName profilePhoto followersCount')
            .lean();

        const total = await Connection.countDocuments({
            follower: userId,
            status: 'accepted',
        });

        const following = connections.map((c: any) => c.following);

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
