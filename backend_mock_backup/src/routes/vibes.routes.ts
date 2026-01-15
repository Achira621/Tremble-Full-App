import { Router } from 'express';
import { param } from 'express-validator';
import * as vibesController from '../controllers/vibes.controller';
import { authenticate } from '../middleware/auth';
import { validate, asyncHandler } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/vibes/:userId
 * @desc    Get user's vibe badges
 * @access  Private
 */
router.get(
    '/:userId',
    authenticate,
    param('userId').notEmpty(),
    validate,
    asyncHandler(vibesController.getUserVibes)
);

/**
 * @route   POST /api/vibes/generate
 * @desc    Generate vibe badges for current user
 * @access  Private
 */
router.post(
    '/generate',
    authenticate,
    asyncHandler(vibesController.generateVibes)
);

export default router;
