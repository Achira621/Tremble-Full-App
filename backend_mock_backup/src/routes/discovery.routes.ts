import { Router } from 'express';
import * as discoveryController from '../controllers/discovery.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/discovery/feed
 * @desc    Get personalized discovery feed
 * @access  Private
 */
router.get(
    '/feed',
    authenticate,
    asyncHandler(discoveryController.getDiscoveryFeed)
);

/**
 * @route   POST /api/discovery/refresh
 * @desc    Refresh discovery pool
 * @access  Private
 */
router.post(
    '/refresh',
    authenticate,
    asyncHandler(discoveryController.refreshDiscovery)
);

/**
 * @route   PUT /api/discovery/preferences
 * @desc    Update discovery preferences
 * @access  Private
 */
router.put(
    '/preferences',
    authenticate,
    asyncHandler(discoveryController.updatePreferences)
);

export default router;
