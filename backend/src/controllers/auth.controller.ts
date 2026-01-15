import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import User from '../models/User';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';
import cache from '../utils/cache';

// Validation rules
export const signupValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters')
        .matches(/^[a-z0-9._]+$/)
        .withMessage('Username can only contain lowercase letters, numbers, dots and underscores'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('fullName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Full name is required'),
];

export const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
];

// Generate JWT Token
const generateToken = (id: string, username: string, email: string): string => {
    return jwt.sign(
        { id, username, email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions
    );
};

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { username, email, password, fullName } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
        });

        if (existingUser) {
            res.status(400).json({
                success: false,
                error: 'User already exists with this email or username',
            });
            return;
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            fullName,
        });

        // Generate token
        const token = generateToken(user._id.toString(), user.username, user.email);

        logger.info(`New user registered: ${username}`);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                },
                token,
            },
        });
    } catch (error: any) {
        logger.error('Signup error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to register user',
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Find user with password field
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            res.status(401).json({
                success: false,
                error: 'Invalid credentials',
            });
            return;
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                error: 'Invalid credentials',
            });
            return;
        }

        // Update last active
        user.lastActive = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id.toString(), user.username, user.email);

        logger.info(`User logged in: ${user.username}`);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    profilePhoto: user.profilePhoto,
                },
                token,
            },
        });
    } catch (error: any) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to login',
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Not authorized',
            });
            return;
        }

        const cacheKey = `user:${req.user.id}`;

        // Try cache first
        const cachedUser = await cache.get(cacheKey);
        if (cachedUser) {
            res.status(200).json({
                success: true,
                data: cachedUser,
            });
            return;
        }

        // Fetch from DB
        const user = await User.findById(req.user.id);

        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        // Cache user data
        await cache.set(cacheKey, user, 300); // 5 minutes

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error: any) {
        logger.error('Get me error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get user',
        });
    }
};

export default {
    signup,
    login,
    getMe,
    signupValidation,
    loginValidation,
};
