import { Response } from 'express';
import { body } from 'express-validator';
import Post from '../models/Post';
import User from '../models/User';
import Connection from '../models/Connection';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';
import cache from '../utils/cache';
import { optimizeImage, createThumbnail } from '../utils/imageProcessor';

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

        // Optimize image
        const optimizedPath = await optimizeImage(req.file.path);
        const thumbnailPath = await createThumbnail(optimizedPath);

        // Create post
        const post = await Post.create({
            user: req.user.id,
            caption: caption || '',
            mediaUrl: optimizedPath,
            thumbnailUrl: thumbnailPath,
            mediaType: req.file.mimetype.startsWith('video') ? 'video' : 'image',
            location,
        });

        // Update user's post count
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { postsCount: 1 },
        });

        // Invalidate relevant caches
        await cache.delPattern(`feed:*`);
        await cache.del(`user:${req.user.id}`);

        logger.info(`New post created by ${req.user.username}`);

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
        const connections = await Connection.find({
            follower: req.user.id,
            status: 'accepted',
        }).select('following');

        const followingIds = connections.map((c) => c.following);

        // Get posts from following users + own posts
        const posts = await Post.find({
            user: { $in: [...followingIds, req.user.id] },
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'username fullName profilePhoto')
            .lean();

        const total = await Post.countDocuments({
            user: { $in: [...followingIds, req.user.id] },
        });

        const result = {
            posts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasMore: skip + posts.length < total,
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

        const post = await Post.findById(postId);

        if (!post) {
            res.status(404).json({ success: false, error: 'Post not found' });
            return;
        }

        const userIdObj = req.user.id as any;
        const hasLiked = post.likes.includes(userIdObj);

        if (hasLiked) {
            // Unlike
            post.likes = post.likes.filter((id) => id.toString() !== req.user!.id);
            post.likesCount = Math.max(0, post.likesCount - 1);
        } else {
            // Like
            post.likes.push(userIdObj);
            post.likesCount += 1;
        }

        await post.save();

        // Invalidate feed cache
        await cache.delPattern(`feed:*`);

        res.status(200).json({
            success: true,
            message: hasLiked ? 'Post unliked' : 'Post liked',
            data: { liked: !hasLiked, likesCount: post.likesCount },
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

        const user = await User.findOne({ username });

        if (!user) {
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

        const posts = await Post.find({ user: user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = user.postsCount || 0;

        const result = {
            posts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasMore: skip + posts.length < total,
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
