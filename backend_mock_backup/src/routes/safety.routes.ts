import { Router } from 'express';
import { body, param } from 'express-validator';
import * as safetyController from '../controllers/safety.controller';
import { authenticate } from '../middleware/auth';
import { validate, asyncHandler } from '../middleware/validation';

const router = Router();

/**
 * @route   POST /api/safety/report
 * @desc    Report a user or content
 * @access  Private
 */
router.post(
    '/report',
    authenticate,
    [
        body('reason').notEmpty().withMessage('Reason is required'),
        validate,
    ],
    asyncHandler(safetyController.reportUser)
);

/**
 * @route   POST /api/safety/block
 * @desc    Block a user
 * @access  Private
 */
router.post(
    '/block',
    authenticate,
    [
        body('blockedUserId').notEmpty().withMessage('User ID is required'),
        validate,
    ],
    asyncHandler(safetyController.blockUser)
);

/**
 * @route   DELETE /api/safety/block/:blockedUserId
 * @desc    Unblock a user
 * @access  Private
 */
router.delete(
    '/block/:blockedUserId',
    authenticate,
    param('blockedUserId').notEmpty(),
    validate,
    asyncHandler(safetyController.unblockUser)
);

/**
 * @route   GET /api/safety/blocked
 * @desc    Get blocked users
 * @access  Private
 */
router.get(
    '/blocked',
    authenticate,
    asyncHandler(safetyController.getBlockedUsers)
);

export default router;
