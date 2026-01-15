import { Router } from 'express';
import { body, param } from 'express-validator';
import * as connectionsController from '../controllers/connections.controller';
import { authenticate } from '../middleware/auth';
import { validate, asyncHandler } from '../middleware/validation';

const router = Router();

/**
 * @route   POST /api/connections/like
 * @desc    Like a user
 * @access  Private
 */
router.post(
    '/like',
    authenticate,
    [
        body('targetUserId').notEmpty().withMessage('Target user ID is required'),
        validate,
    ],
    asyncHandler(connectionsController.likeUser)
);

/**
 * @route   POST /api/connections/pass
 * @desc    Pass on a user
 * @access  Private
 */
router.post(
    '/pass',
    authenticate,
    [
        body('targetUserId').notEmpty().withMessage('Target user ID is required'),
        validate,
    ],
    asyncHandler(connectionsController.passUser)
);

/**
 * @route   POST /api/connections/tremble
 * @desc    Tremble a user (super like / connection request)
 * @access  Private
 */
router.post(
    '/tremble',
    authenticate,
    [
        body('targetUserId').notEmpty().withMessage('Target user ID is required'),
        validate,
    ],
    asyncHandler(connectionsController.trembleUser)
);

/**
 * @route   GET /api/connections/matches
 * @desc    Get user's matches
 * @access  Private
 */
router.get(
    '/matches',
    authenticate,
    asyncHandler(connectionsController.getMatches)
);

/**
 * @route   DELETE /api/connections/:matchId
 * @desc    Unmatch / remove connection
 * @access  Private
 */
router.delete(
    '/:matchId',
    authenticate,
    param('matchId').notEmpty(),
    validate,
    asyncHandler(connectionsController.unmatch)
);

export default router;
