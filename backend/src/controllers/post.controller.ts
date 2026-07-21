import { Response } from 'express';
import { body } from 'express-validator';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';
import cache from '../utils/cache';
import { optimizeImage, createThumbnail } from '../utils/imageProcessor';
import { insforge } from '../config/database';

export const createPostValidation = [
    body('caption').optional().trim().isLength({ max: 2200 }),
    body('location').optional().trim().isLength({ max: 100 }),
];

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authorized' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ success: false, error: 'Media file is required' });
            return;
        }

        const { caption, location } = req.body;

        // Process image in memory
        const optimizedBuffer = await optimizeImage(req.file.buffer);
        const thumbnailBuffer = await createThumbnail(optimizedBuffer);

        // Upload to InsForge Storage (photos bucket)
        const timestamp = Date.now();
        const mediaFileName = `${req.user.id}_${timestamp}_media.webp`;
        const thumbFileName = `${req.user.id}_${timestamp}_thumb.webp`;

        const { error: uploadError } = await insforge.storage
            .from('photos')
            .upload(mediaFileName, new Blob([optimizedBuffer]));
            
        const { error: thumbUploadError } = await insforge.storage
            .from('photos')
            .upload(thumbFileName, new Blob([thumbnailBuffer]));

        if (uploadError) throw uploadError;
        if (thumbUploadError) throw thumbUploadError;

        // Get public URLs
        const mediaUrl = insforge.storage.from('photos').getPublicUrl(mediaFileName);
        const thumbnailUrl = insforge.storage.from('photos').getPublicUrl(thumbFileName);

        const { data: posts, error: createError } = await insforge.database
            .from('posts')
            .insert([{
                user_id: req.user.id,
                caption: caption || '',
                media_url: mediaUrl,
                thumbnail_url: thumbnailUrl,
                media_type: req.file.mimetype.startsWith('video') ? 'video' : 'image',
                location
            }])
            .select();

        if (createError) throw createError;
        if (!posts || posts.length === 0) throw new Error('Create post failed');
        const post = posts[0];

        // Note: user's posts_count is automatically updated via PostgreSQL triggers on the posts table.


        // Invalidate relevant caches
        await cache.delPattern(`feed:*`);
        await cache.del(`user:${req.user.id}`);

        logger.info(`New post created by user ${req.user.id}`);

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: post,
        });
    } catch (error: any) {
        logger.error('Create post error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create post',
        });
    }
};

// @desc    Get feed (posts from following users)
// @route   GET /api/posts/feed
// @access  Private
export const getFeed = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authorized' });
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const cacheKey = `feed:${req.user.id}:${page}:${limit}`;

        // Check cache
        const cached = await cache.get(cacheKey);
        if (cached) {
            res.status(200).json({ success: true, data: cached });
            return;
        }

        // Get users that current user is following
        const { data: connections, error: connError } = await insforge.database
            .from('connections')
            .select('following_id')
            .eq('follower_id', req.user.id)
            .eq('status', 'accepted');

        if (connError) throw connError;
        
        const followingIds = connections ? connections.map(c => c.following_id) : [];
        const userPool = [...followingIds, req.user.id];

        // Get posts from following users + own posts
        const { data: posts, error: postError, count } = await insforge.database
            .from('posts')
            .select('*, users(username, full_name, profile_photo)', { count: 'exact' })
            .in('user_id', userPool)
            .order('created_at', { ascending: false })
            .range(skip, skip + limit - 1);

        if (postError) throw postError;
        
        const total = count || 0;

        const result = {
            posts: posts || [],
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasMore: skip + (posts?.length || 0) < total,
            },
        };

        // Cache feed for 2 minutes
        await cache.set(cacheKey, result, 120);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        logger.error('Get feed error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get feed',
        });
    }
};

// @desc    Like/Unlike post
// @route   POST /api/posts/:postId/like
// @access  Private
export const toggleLike = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authorized' });
            return;
        }

        const { postId } = req.params;

        // Check if post exists
        const { data: post, error: fetchError } = await insforge.database
            .from('posts')
            .select('likes_count')
            .eq('id', postId)
            .single();

        if (fetchError || !post) {
            res.status(404).json({ success: false, error: 'Post not found' });
            return;
        }

        // Check if user already liked the post
        const { data: existingLike, error: likeError } = await insforge.database
            .from('post_likes')
            .select('user_id')
            .eq('post_id', postId)
            .eq('user_id', req.user.id)
            .single();

        let hasLiked = false;
        let newLikesCount = post.likes_count || 0;

        if (existingLike) {
            // Unlike 
            await insforge.database
                .from('post_likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', req.user.id);
            
            newLikesCount = Math.max(0, newLikesCount - 1);
            hasLiked = true;
        } else {
            // Like
            await insforge.database
                .from('post_likes')
                .insert([{
                    post_id: postId,
                    user_id: req.user.id
                }]);
            
            newLikesCount += 1;
        }

        // Note: Post likes_count is automatically updated via PostgreSQL triggers on the post_likes table.

        // Invalidate feed cache
        await cache.delPattern(`feed:*`);

        res.status(200).json({
            success: true,
            message: hasLiked ? 'Post unliked' : 'Post liked',
            data: { liked: !hasLiked, likesCount: newLikesCount },
        });
    } catch (error: any) {
        logger.error('Toggle like error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to toggle like',
        });
    }
};

// @desc    Get user's posts
// @route   GET /api/posts/user/:username
// @access  Public
export const getUserPosts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { username } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const { data: user, error: userError } = await insforge.database
            .from('users')
            .select('id, posts_count')
            .eq('username', username)
            .single();

        if (userError || !user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }

        const cacheKey = `posts:${username}:${page}:${limit}`;

        // Check cache
        const cached = await cache.get(cacheKey);
        if (cached) {
            res.status(200).json({ success: true, data: cached });
            return;
        }

        const { data: posts, error: postError, count } = await insforge.database
            .from('posts')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(skip, skip + limit - 1);

        if (postError) throw postError;

        const total = count || user.posts_count || 0;

        const result = {
            posts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasMore: skip + (posts?.length || 0) < total,
            },
        };

        // Cache for 5 minutes
        await cache.set(cacheKey, result, 300);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        logger.error('Get user posts error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get user posts',
        });
    }
};

export default {
    createPost,
    getFeed,
    toggleLike,
    getUserPosts,
    createPostValidation,
};
