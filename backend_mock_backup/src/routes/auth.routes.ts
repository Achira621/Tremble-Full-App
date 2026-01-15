import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate, asyncHandler } from '../middleware/validation';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('username').isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('name').notEmpty().withMessage('Name is required'),
        body('age').isInt({ min: 16, max: 100 }).withMessage('Age must be between 16 and 100'),
        validate,
    ],
    asyncHandler(authController.register)
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
        validate,
    ],
    asyncHandler(authController.login)
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, asyncHandler(authController.getMe));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticate, asyncHandler(authController.logout));

export default router;
