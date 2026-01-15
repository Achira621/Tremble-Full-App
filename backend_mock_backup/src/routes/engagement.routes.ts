import { Router } from 'express';
import * as engagementController from '../controllers/engagement.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/engagement/streak
 * @desc    Get user's daily streak
 * @access  Private
 */
router.get(
    '/streak',
    authenticate,
    asyncHandler(engagementController.getDailyStreak)
);

/**
 * @route   POST /api/engagement/streak/claim
 * @desc    Claim streak reward
 * @access  Private
 */
router.post(
    '/streak/claim',
    authenticate,
    asyncHandler(engagementController.claimStreakReward)
);

/**
 * @route   GET /api/engagement/achievements
 * @desc    Get user achievements
 * @access  Private
 */
router.get(
    '/achievements',
    authenticate,
    asyncHandler(engagementController.getAchievements)
);

/**
 * @route   GET /api/engagement/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get(
    '/notifications',
    authenticate,
    asyncHandler(engagementController.getNotifications)
);

/**
 * @route   PUT /api/engagement/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put(
    '/notifications/:notificationId/read',
    authenticate,
    asyncHandler(engagementController.markNotificationRead)
);

/**
 * @route   GET /api/engagement/secret-admirers
 * @desc    Get secret admirers count
 * @access  Private
 */
router.get(
    '/secret-admirers',
    authenticate,
    asyncHandler(engagementController.getSecretAdmirers)
);

/**
 * @route   POST /api/engagement/secret-admirers/reveal
 * @desc    Reveal one secret admirer
 * @access  Private
 */
router.post(
    '/secret-admirers/reveal',
    authenticate,
    asyncHandler(engagementController.revealSecretAdmirer)
);

/**
 * @route   GET /api/engagement/daily-rewards
 * @desc    Get daily rewards
 * @access  Private
 */
router.get(
    '/daily-rewards',
    authenticate,
    asyncHandler(engagementController.getDailyRewards)
);

/**
 * @route   GET /api/engagement/highlights
 * @desc    Get activity highlights
 * @access  Private
 */
router.get(
    '/highlights',
    authenticate,
    asyncHandler(engagementController.getActivityHighlights)
);

/**
 * @route   GET /api/engagement/mystery-boxes
 * @desc    Get mystery boxes
 * @access  Private
 */
router.get(
    '/mystery-boxes',
    authenticate,
    asyncHandler(engagementController.getMysteryBoxes)
);

/**
 * @route   POST /api/engagement/mystery-boxes/:boxId/open
 * @desc    Open mystery box
 * @access  Private
 */
router.post(
    '/mystery-boxes/:boxId/open',
    authenticate,
    asyncHandler(engagementController.openMysteryBox)
);

/**
 * @route   GET /api/engagement/stats
 * @desc    Get engagement statistics
 * @access  Private
 */
router.get(
    '/stats',
    authenticate,
    asyncHandler(engagementController.getEngagementStats)
);

export default router;
