import { Router } from 'express';
import { body, param } from 'express-validator';
import * as glimpsesController from '../controllers/glimpses.controller';
import { authenticate } from '../middleware/auth';
import { validate, asyncHandler } from '../middleware/validation';

const router = Router();

/**
 * @route   POST /api/glimpses
 * @desc    Create a new glimpse
 * @access  Private
 */
router.post(
    '/',
    authenticate,
    [
        body('photoUrl').isURL().withMessage('Valid photo URL is required'),
        body('caption').optional().isLength({ max: 150 }),
        validate,
    ],
    asyncHandler(glimpsesController.createGlimpse)
);

/**
 * @route   GET /api/glimpses/feed
 * @desc    Get infinite scroll feed (algorithm-driven)
 * @access  Private
 */
router.get(
    '/feed',
    authenticate,
    asyncHandler(glimpsesController.getGlimpsesFeed)
);

/**
 * @route   GET /api/glimpses/my
 * @desc    Get user's own glimpses
 * @access  Private
 */
router.get(
    '/my',
    authenticate,
    asyncHandler(glimpsesController.getMyGlimpses)
);

/**
 * @route   POST /api/glimpses/:glimpseId/view
 * @desc    Record view interaction
 * @access  Private
 */
router.post(
    '/:glimpseId/view',
    authenticate,
    param('glimpseId').notEmpty(),
    validate,
    asyncHandler(glimpsesController.recordView)
);

/**
 * @route   POST /api/glimpses/:glimpseId/like
 * @desc    Like/unlike a glimpse
 * @access  Private
 */
router.post(
    '/:glimpseId/like',
    authenticate,
    param('glimpseId').notEmpty(),
    validate,
    asyncHandler(glimpsesController.likeGlimpse)
);

/**
 * @route   POST /api/glimpses/:glimpseId/tremble
 * @desc    Tremble on a glimpse (super like)
 * @access  Private
 */
router.post(
    '/:glimpseId/tremble',
    authenticate,
    param('glimpseId').notEmpty(),
    validate,
    asyncHandler(glimpsesController.trembleGlimpse)
);

/**
 * @route   POST /api/glimpses/:glimpseId/comment
 * @desc    Comment on a glimpse
 * @access  Private
 */
router.post(
    '/:glimpseId/comment',
    authenticate,
    [
        param('glimpseId').notEmpty(),
        body('content').notEmpty().isLength({ max: 200 }),
        validate,
    ],
    asyncHandler(glimpsesController.commentOnGlimpse)
);

/**
 * @route   GET /api/glimpses/:glimpseId/stats
 * @desc    Get glimpse stats (for creator)
 * @access  Private
 */
router.get(
    '/:glimpseId/stats',
    authenticate,
    param('glimpseId').notEmpty(),
    validate,
    asyncHandler(glimpsesController.getGlimpseStats)
);

/**
 * @route   DELETE /api/glimpses/:glimpseId
 * @desc    Delete a glimpse
 * @access  Private
 */
router.delete(
    '/:glimpseId',
    authenticate,
    param('glimpseId').notEmpty(),
    validate,
    asyncHandler(glimpsesController.deleteGlimpse)
);

export default router;
