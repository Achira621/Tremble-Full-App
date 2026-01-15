import { Router } from 'express';
import { body, param } from 'express-validator';
import * as usersController from '../controllers/users.controller';
import { authenticate } from '../middleware/auth';
import { validate, asyncHandler } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/users/:userId
 * @desc    Get user profile by ID
 * @access  Private
 */
router.get(
    '/:userId',
    authenticate,
    param('userId').notEmpty(),
    validate,
    asyncHandler(usersController.getUserProfile)
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
    '/profile',
    authenticate,
    asyncHandler(usersController.updateProfile)
);

/**
 * @route   POST /api/users/photos
 * @desc    Upload profile photo
 * @access  Private
 */
router.post(
    '/photos',
    authenticate,
    [
        body('photoUrl').isURL().withMessage('Valid photo URL is required'),
        validate,
    ],
    asyncHandler(usersController.uploadPhoto)
);

/**
 * @route   DELETE /api/users/photos/:photoId
 * @desc    Delete profile photo
 * @access  Private
 */
router.delete(
    '/photos/:photoId',
    authenticate,
    param('photoId').notEmpty(),
    validate,
    asyncHandler(usersController.deletePhoto)
);

/**
 * @route   PUT /api/users/settings
 * @desc    Update user settings
 * @access  Private
 */
router.put(
    '/settings',
    authenticate,
    asyncHandler(usersController.updateSettings)
);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get(
    '/stats',
    authenticate,
    asyncHandler(usersController.getUserStats)
);

export default router;
