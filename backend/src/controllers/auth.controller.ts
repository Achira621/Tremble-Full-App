import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';
import cache from '../utils/cache';
import { insforge } from '../config/database';

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
    body('name')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Name is required'),
    body('fullName')
        .optional({ nullable: true, checkFalsy: true })
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
        const { username, email, password, fullName, name, age, bio, interests, photos } = req.body;
        const userFullName = fullName || name;

        // Check if user exists by email
        const { data: existingByEmail } = await insforge.database
            .from('users')
            .select('id')
            .eq('email', email);

        if (existingByEmail && existingByEmail.length > 0) {
            res.status(400).json({
                success: false,
                error: 'User already exists with this email',
            });
            return;
        }

        // Check if user exists by username
        const { data: existingByUsername } = await insforge.database
            .from('users')
            .select('id')
            .eq('username', username);

        if (existingByUsername && existingByUsername.length > 0) {
            res.status(400).json({
                success: false,
                error: 'User already exists with this username',
            });
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const { data: users, error: insertError } = await insforge.database
            .from('users')
            .insert([{
                username,
                email,
                password: hashedPassword,
                full_name: userFullName,
                age: age || null,
                bio: bio || null,
                interests: interests || [],
                photos: photos || [],
                profile_photo: (photos && photos.length > 0) ? photos[0] : null,
            }])
            .select();

        if (insertError) {
            console.error('Insert user error:', insertError);
            res.status(400).json({
                success: false,
                error: insertError.message || 'Failed to create user',
            });
            return;
        }

        if (!users || users.length === 0) throw new Error('Failed to create user');
        
        const user = users[0];

        // Generate token
        const token = generateToken(user.id, user.username, user.email);

        logger.info(`New user registered: ${username}`);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.full_name,
                    name: user.full_name,
                    age: user.age,
                    bio: user.bio,
                    photos: user.photos || [],
                    interests: user.interests || [],
                    vibeBadges: user.badges?.map((b: any) => b.name) || [],
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

        const { data: user, error: fetchError } = await insforge.database
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (fetchError || !user) {
            logger.warn(`Login failed: Invalid credentials for ${email}`);
            res.status(401).json({
                success: false,
                error: 'Invalid credentials',
            });
            return;
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                error: 'Invalid credentials',
            });
            return;
        }

        // Update last active
        await insforge.database
            .from('users')
            .update({ last_active: new Date().toISOString() })
            .eq('id', user.id);

        // Generate token
        const token = generateToken(user.id, user.username, user.email);

        logger.info(`User logged in: ${user.username}`);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.full_name,
                    profilePhoto: user.profile_photo,
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
        const { data: user, error } = await insforge.database
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error || !user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            name: user.full_name,
            age: user.age,
            bio: user.bio,
            photos: user.photos,
            interests: user.interests,
            vibeBadges: user.badges?.map((b: any) => b.name) || [],
        };

        // Cache user data
        await cache.set(cacheKey, userData, 300); // 5 minutes

        res.status(200).json({
            success: true,
            data: userData,
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
