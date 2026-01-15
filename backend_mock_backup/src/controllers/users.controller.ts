import { Request, Response } from 'express';
import { dataStore } from '../data/store';
import { ApiResponse, UserProfile, User, UserPhoto, UserStats } from '../types';
import { AppError } from '../middleware/errorHandler';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, APP_CONSTANTS } from '../utils/constants';
import { generateId } from '../utils/generators';
import { isValidBio, isValidPhotoUrl, isValidInterests, sanitizeUserInput } from '../utils/validators';

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
 * Get user profile by ID
 */
export const getUserProfile = (
    req: Request,
    res: Response<ApiResponse<UserProfile>>
): void => {
    const { userId } = req.params;

    const user = dataStore.getUser(userId);
    if (!user) {
        throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 404);
    }

    res.json({
        success: true,
        data: toUserProfile(user),
    });
};

/**
 * Update user profile
 */
export const updateProfile = (
    req: Request,
    res: Response<ApiResponse<UserProfile>>
): void => {
    const userId = req.user!.userId;
    const { name, age, bio, interests, location } = req.body;

    const user = dataStore.getUser(userId);
    if (!user) {
        throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 404);
    }

    const updates: Partial<User> = {};

    if (name !== undefined) {
        updates.name = sanitizeUserInput(name);
    }

    if (age !== undefined) {
        if (age < APP_CONSTANTS.MIN_AGE || age > APP_CONSTANTS.MAX_AGE) {
            throw new AppError(`Age must be between ${APP_CONSTANTS.MIN_AGE} and ${APP_CONSTANTS.MAX_AGE}`, 400);
        }
        updates.age = age;
    }

    if (bio !== undefined) {
        if (!isValidBio(bio)) {
            throw new AppError(`Bio must be between ${APP_CONSTANTS.MIN_BIO_LENGTH} and ${APP_CONSTANTS.MAX_BIO_LENGTH} characters`, 400);
        }
        updates.bio = sanitizeUserInput(bio);
    }

    if (interests !== undefined) {
        if (!isValidInterests(interests)) {
            throw new AppError(`Select between ${APP_CONSTANTS.MIN_INTERESTS_REQUIRED} and ${APP_CONSTANTS.MAX_INTERESTS} interests`, 400);
        }
        updates.interests = interests;
    }

    if (location !== undefined) {
        updates.location = location;
    }

    const updatedUser = dataStore.updateUser(userId, updates);

    res.json({
        success: true,
        message: SUCCESS_MESSAGES.USER_UPDATED,
        data: toUserProfile(updatedUser!),
    });
};

/**
 * Upload profile photo
 */
export const uploadPhoto = (
    req: Request,
    res: Response<ApiResponse<UserProfile>>
): void => {
    const userId = req.user!.userId;
    const { photoUrl } = req.body;

    const user = dataStore.getUser(userId);
    if (!user) {
        throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 404);
    }

    if (user.photos.length >= APP_CONSTANTS.MAX_PHOTOS_PER_USER) {
        throw new AppError(ERROR_MESSAGES.MAX_PHOTOS_EXCEEDED, 400);
    }

    if (!isValidPhotoUrl(photoUrl)) {
        throw new AppError('Invalid photo URL', 400);
    }

    const newPhoto: UserPhoto = {
        id: generateId(),
        url: photoUrl,
        order: user.photos.length,
        uploadedAt: new Date(),
    };

    const updatedUser = dataStore.updateUser(userId, {
        photos: [...user.photos, newPhoto],
    });

    res.json({
        success: true,
        data: toUserProfile(updatedUser!),
    });
};

/**
 * Delete profile photo
 */
export const deletePhoto = (
    req: Request,
    res: Response<ApiResponse<UserProfile>>
): void => {
    const userId = req.user!.userId;
    const { photoId } = req.params;

    const user = dataStore.getUser(userId);
    if (!user) {
        throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 404);
    }

    const updatedPhotos = user.photos.filter(photo => photo.id !== photoId);

    if (updatedPhotos.length === user.photos.length) {
        throw new AppError('Photo not found', 404);
    }

    // Reorder photos
    updatedPhotos.forEach((photo, index) => {
        photo.order = index;
    });

    const updatedUser = dataStore.updateUser(userId, { photos: updatedPhotos });

    res.json({
        success: true,
        data: toUserProfile(updatedUser!),
    });
};

/**
 * Update user settings
 */
export const updateSettings = (
    req: Request,
    res: Response<ApiResponse<UserProfile>>
): void => {
    const userId = req.user!.userId;
    const settings = req.body;

    const user = dataStore.getUser(userId);
    if (!user) {
        throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 404);
    }

    const updatedUser = dataStore.updateUser(userId, {
        settings: { ...user.settings, ...settings },
    });

    res.json({
        success: true,
        data: toUserProfile(updatedUser!),
    });
};

/**
 * Get user statistics
 */
export const getUserStats = (
    req: Request,
    res: Response<ApiResponse<UserStats>>
): void => {
    const userId = req.user!.userId;

    const connections = dataStore.getUserConnections(userId);
    const matches = dataStore.getUserMatches(userId);
    const posts = dataStore.getUserPosts(userId);

    const likesGiven = connections.filter(c => c.fromUserId === userId && c.action === 'like').length;
    const likesReceived = connections.filter(c => c.toUserId === userId && c.action === 'like').length;
    const tremblesGiven = connections.filter(c => c.fromUserId === userId && c.action === 'tremble').length;
    const tremblesReceived = connections.filter(c => c.toUserId === userId && c.action === 'tremble').length;

    const stats: UserStats = {
        likesGiven,
        likesReceived,
        tremblesGiven,
        tremblesReceived,
        matches: matches.length,
        postsCount: posts.length,
    };

    res.json({
        success: true,
        data: stats,
    });
};
