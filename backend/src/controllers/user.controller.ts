import { Response } from 'express';
import { body } from 'express-validator';
import User from '../models/User';
import Post from '../models/Post';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';
import cache from '../utils/cache';

export const updateProfileValidation = [
    body('fullName').optional().trim().isLength({ max: 50 }),
    body('bio').optional().trim().isLength({ max: 150 }),
];

// @desc    Get user profile
// @route   GET /api/users/:username
// @access  Public
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { username } = req.params;
        const cacheKey = `profile:${username}`;

        // Check cache
        const cached = await cache.get(cacheKey);
        if (cached) {
            res.status(200).json({ success: true, data: cached });
            return;
        }

        const user = await User.findOne({ username })
            .select('-password')
            .lean(); // Use lean() for better performance

        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        // Get user's posts count
        const postsCount = await Post.countDocuments({ user: user._id });

        const profile = {
            ...user,
            postsCount,
        };

        // Cache profile
        await cache.set(cacheKey, profile, 600); // 10 minutes

        res.status(200).json({
            success: true,
            data: profile,
        });
    } catch (error: any) {
        logger.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get user profile',
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authorized' });
            return;
        }

        const { fullName, bio } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }

        // Update fields
        if (fullName) user.fullName = fullName;
        if (bio !== undefined) user.bio = bio;

        await user.save();

        // Invalidate cache
        await cache.del(`user:${user._id}`);
        await cache.del(`profile:${user.username}`);

        logger.info(`User profile updated: ${user.username}`);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user,
        });
    } catch (error: any) {
        logger.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update profile',
        });
    }
};

// @desc    Search users
// @route   GET /api/users/search?q=query
// @access  Public
export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { q } = req.query;

        if (!q || typeof q !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Search query is required',
            });
            return;
        }

        const cacheKey = `search:${q.toLowerCase()}`;

        // Check cache
        const cached = await cache.get(cacheKey);
        if (cached) {
            res.status(200).json({ success: true, data: cached });
            return;
        }

        // Text search using index
        const users = await User.find(
            { $text: { $search: q } },
            { score: { $meta: 'textScore' } }
        )
            .select('username fullName profilePhoto followersCount')
            .sort({ score: { $meta: 'textScore' } })
            .limit(20)
            .lean();

        // Cache results
        await cache.set(cacheKey, users, 300); // 5 minutes

        res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error: any) {
        logger.error('Search users error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to search users',
        });
    }
};

// @desc    Add vibe to user
// @route   POST /api/users/vibe
// @access  Private
export const addVibe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authorized' });
            return;
        }

        const { vibe } = req.body;

        if (!vibe) {
            res.status(400).json({ success: false, error: 'Vibe is required' });
            return;
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }

        // Initialize vibes if undefined
        if (!user.vibes) user.vibes = [];

        // Check if already has vibe
        if (!user.vibes.includes(vibe)) {
            user.vibes.push(vibe);
            // Increment curiosity score for social interaction
            user.curiosityScore = (user.curiosityScore || 100) + 5;
            await user.save();
        }

        // Invalidate cache
        await cache.del(`user:${user._id}`);
        await cache.del(`profile:${user.username}`);

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error: any) {
        logger.error('Add vibe error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to add vibe',
        });
    }
};

export default {
    getUserProfile,
    updateProfile,
    searchUsers,
    addVibe,
    updateProfileValidation,
};
