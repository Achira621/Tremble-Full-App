import { Response } from 'express';
import { body } from 'express-validator';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';
import cache from '../utils/cache';
import { insforge } from '../config/database';
import { optimizeImage } from '../utils/imageProcessor';

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
        const cacheKey = "profile: + username + ";

        // Check cache
        const cached = await cache.get(cacheKey);
        if (cached) {
            res.status(200).json({ success: true, data: cached });
            return;
        }

        const { data: user, error: userError } = await insforge.database
            .from('users')
            .select('id, username, email, full_name, bio, age, interests, photos, profile_photo, followers_count, following_count, posts_count, last_active, vibes, badges, curiosity_score, created_at, updated_at')
            .eq('username', username)
            .single();

        if (userError || !user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        // The posts_count is inherently part of the table now, we can rely on it or fetch dynamically
        // Since we have a 'posts_count' column per table schema, we don't need to manually count here unless triggered separately
        const profile = {
            ...user,
            fullName: user.full_name,
            postsCount: user.posts_count,
            followersCount: user.followers_count,
            followingCount: user.following_count
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

        const updateData: any = {};
        if (fullName) updateData.full_name = fullName;
        if (bio !== undefined) updateData.bio = bio;
        updateData.updated_at = new Date().toISOString();

        const { data: user, error } = await insforge.database
            .from('users')
            .update(updateData)
            .eq('id', req.user.id)
            .select()
            .single();

        if (error || !user) {
            res.status(404).json({ success: false, error: 'User not found or update failed' });
            return;
        }

        // Invalidate cache
        await cache.del(`user:${user.id}`);
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

        // Text search using ILIKE
        const { data: users, error } = await insforge.database
            .from('users')
            .select('id, username, full_name, profile_photo, followers_count')
            .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
            .limit(20);
            
        if (error) throw error;

        // Cache results
        await cache.set(cacheKey, users || [], 300); // 5 minutes

        res.status(200).json({
            success: true,
            data: users || [],
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

        const { data: user, error: fetchError } = await insforge.database
            .from('users')
            .select('id, username, vibes, curiosity_score')
            .eq('id', req.user.id)
            .single();

        if (fetchError || !user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }

        const currentVibes = user.vibes || [];

        // Check if already has vibe
        if (!currentVibes.includes(vibe)) {
            const updatedVibes = [...currentVibes, vibe];
            const updatedScore = (user.curiosity_score || 100) + 5;
            
            const { error: updateError } = await insforge.database
                .from('users')
                .update({ vibes: updatedVibes, curiosity_score: updatedScore })
                .eq('id', user.id);
                
            if (updateError) throw updateError;
        }

        // Invalidate cache
        await cache.del(`user:${user.id}`);
        await cache.del(`profile:${user.username}`);

        res.status(200).json({
            success: true,
            message: 'Vibe added'
        });
    } catch (error: any) {
        logger.error('Add vibe error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to add vibe',
        });
    }
};

// @desc    Upload photo
// @route   POST /api/users/upload-photo
// @access  Public (for onboarding)
export const uploadPhoto = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                error: 'No file uploaded',
            });
            return;
        }

        // Optimize image in memory
        const optimizedBuffer = await optimizeImage(req.file.buffer, { width: 500, height: 500, format: 'webp' });

        // Upload to InsForge Storage
        const timestamp = Date.now();
        const fileName = `profile_${timestamp}.webp`;
        
        const { error: uploadError } = await insforge.storage
            .from('photos')
            .upload(fileName, new Blob([optimizedBuffer]));

        if (uploadError) throw uploadError;

        // Get public URL
        const photoUrl = insforge.storage.from('photos').getPublicUrl(fileName);

        res.status(200).json({
            success: true,
            data: {
                url: photoUrl,
            },
        });
    } catch (error: any) {
        logger.error('Upload photo error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload photo',
        });
    }
};

export default {
    getUserProfile,
    updateProfile,
    searchUsers,
    addVibe,
    uploadPhoto,
    updateProfileValidation,
};
