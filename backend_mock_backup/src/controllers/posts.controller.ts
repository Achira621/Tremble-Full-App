import { Request, Response } from 'express';
import { dataStore } from '../data/store';
import { ApiResponse, Post, UserProfile, User } from '../types';
import { AppError } from '../middleware/errorHandler';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import { generateId } from '../utils/generators';
import { isValidCaption, isValidPhotoUrl, sanitizeUserInput } from '../utils/validators';

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
 * Create a new post
 */
export const createPost = (
    req: Request,
    res: Response<ApiResponse<Post>>
): void => {
    const userId = req.user!.userId;
    const { photoUrl, caption } = req.body;

    if (!isValidPhotoUrl(photoUrl)) {
        throw new AppError('Invalid photo URL', 400);
    }

    if (!isValidCaption(caption)) {
        throw new AppError(ERROR_MESSAGES.INVALID_CAPTION, 400);
    }

    const post: Post = {
        id: generateId(),
        userId,
        photoUrl,
        caption: sanitizeUserInput(caption),
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    dataStore.createPost(post);

    res.status(201).json({
        success: true,
        message: SUCCESS_MESSAGES.POST_CREATED,
        data: post,
    });
};

/**
 * Get a single post
 */
export const getPost = (
    req: Request,
    res: Response<ApiResponse<Post>>
): void => {
    const { postId } = req.params;

    const post = dataStore.getPost(postId);
    if (!post) {
        throw new AppError(ERROR_MESSAGES.POST_NOT_FOUND, 404);
    }

    res.json({
        success: true,
        data: post,
    });
};

/**
 * Get user's posts
 */
export const getUserPosts = (
    req: Request,
    res: Response<ApiResponse<Post[]>>
): void => {
    const { userId } = req.params;

    const posts = dataStore.getUserPosts(userId);

    res.json({
        success: true,
        data: posts,
    });
};

/**
 * Delete a post
 */
export const deletePost = (
    req: Request,
    res: Response<ApiResponse>
): void => {
    const userId = req.user!.userId;
    const { postId } = req.params;

    const post = dataStore.getPost(postId);
    if (!post) {
        throw new AppError(ERROR_MESSAGES.POST_NOT_FOUND, 404);
    }

    if (post.userId !== userId) {
        throw new AppError(ERROR_MESSAGES.FORBIDDEN, 403);
    }

    dataStore.deletePost(postId);

    res.json({
        success: true,
        message: SUCCESS_MESSAGES.POST_DELETED,
    });
};

/**
 * Get feed of posts from connections
 */
export const getFeed = (
    req: Request,
    res: Response<ApiResponse<Array<{ post: Post; user: UserProfile }>>>
): void => {
    const userId = req.user!.userId;

    // Get user's matches
    const matches = dataStore.getUserMatches(userId);
    const matchedUserIds = matches.map(match =>
        match.user1Id === userId ? match.user2Id : match.user1Id
    );

    // Get posts from matched users
    const allPosts = dataStore.getAllPosts();
    const feedPosts = allPosts
        .filter(post => matchedUserIds.includes(post.userId))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 50); // Limit to 50 most recent posts

    const postsWithUsers = feedPosts.map(post => {
        const user = dataStore.getUser(post.userId);
        return {
            post,
            user: user ? toUserProfile(user) : null,
        };
    }).filter(p => p.user !== null) as Array<{ post: Post; user: UserProfile }>;

    res.json({
        success: true,
        data: postsWithUsers,
    });
};
