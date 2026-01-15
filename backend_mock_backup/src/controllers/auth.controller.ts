import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dataStore } from '../data/store';
import { User, RegisterRequest, LoginRequest, AuthResponse, ApiResponse, UserProfile } from '../types';
import { generateId } from '../utils/generators';
import { isValidEmail, isValidUsername, isValidPassword, isValidAge, sanitizeUserInput } from '../utils/validators';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import { AppError } from '../middleware/errorHandler';
import config from '../config';

/**
 * Convert User to UserProfile (remove sensitive data)
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
 * Generate JWT token
 */
const generateToken = (userId: string, email: string): string => {
    return jwt.sign(
        { userId, email },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn as any }
    );
};

/**
 * Register a new user
 */
export const register = async (
    req: Request<{}, {}, RegisterRequest>,
    res: Response<ApiResponse<AuthResponse>>
): Promise<void> => {
    const { email, username, password, name, age } = req.body;

    // Validate input
    if (!isValidEmail(email)) {
        throw new AppError('Invalid email format', 400);
    }

    if (!isValidUsername(username)) {
        throw new AppError('Username must be 3-20 characters (alphanumeric and underscore only)', 400);
    }

    if (!isValidPassword(password)) {
        throw new AppError('Password must be at least 6 characters', 400);
    }

    if (!isValidAge(age)) {
        throw new AppError(`Age must be between 16 and 100`, 400);
    }

    // Check if user already exists
    if (dataStore.getUserByEmail(email)) {
        throw new AppError(ERROR_MESSAGES.EMAIL_EXISTS, 400);
    }

    if (dataStore.getUserByUsername(username)) {
        throw new AppError(ERROR_MESSAGES.USERNAME_EXISTS, 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user: User = {
        id: generateId(),
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash,
        name: sanitizeUserInput(name),
        age,
        bio: '',
        photos: [],
        interests: [],
        location: {
            enabled: false,
        },
        settings: {
            privacyMode: 'public',
            showLocation: false,
            showAge: true,
            discoveryEnabled: true,
            notificationsEnabled: true,
            emailNotifications: false,
        },
        vibeBadges: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActive: new Date(),
    };

    dataStore.createUser(user);

    // Generate token
    const token = generateToken(user.id, user.email);

    res.status(201).json({
        success: true,
        message: SUCCESS_MESSAGES.USER_REGISTERED,
        data: {
            user: toUserProfile(user),
            token,
        },
    });
};

/**
 * Login user
 */
export const login = async (
    req: Request<{}, {}, LoginRequest>,
    res: Response<ApiResponse<AuthResponse>>
): Promise<void> => {
    const { email, password } = req.body;

    // Find user
    const user = dataStore.getUserByEmail(email);
    if (!user) {
        throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
        throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, 401);
    }

    // Update last active
    dataStore.updateUser(user.id, { lastActive: new Date() });

    // Generate token
    const token = generateToken(user.id, user.email);

    res.json({
        success: true,
        message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
        data: {
            user: toUserProfile(user),
            token,
        },
    });
};

/**
 * Get current user profile
 */
export const getMe = (
    req: Request,
    res: Response<ApiResponse<UserProfile>>
): void => {
    const userId = req.user!.userId;

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
 * Logout (client-side token removal, no server action needed)
 */
export const logout = (
    _req: Request,
    res: Response<ApiResponse>
): void => {
    res.json({
        success: true,
        message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
    });
};
