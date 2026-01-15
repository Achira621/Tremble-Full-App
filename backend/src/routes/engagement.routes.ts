import { Router } from 'express';
import * as engagementController from '../controllers/engagement.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

// Streaks
router.get('/streak', engagementController.getDailyStreak);
router.post('/streak/claim', engagementController.claimStreakReward);

// Achievements
router.get('/achievements', engagementController.getAchievements);

// Notifications
router.get('/notifications', engagementController.getNotifications);
router.put('/notifications/:id/read', engagementController.markNotificationRead);

// Secret Admirers
router.get('/secret-admirers', engagementController.getSecretAdmirers);
router.post('/secret-admirers/reveal', engagementController.revealSecretAdmirer);

// Mystery Boxes
router.get('/mystery-boxes', engagementController.getMysteryBoxes);
router.post('/mystery-boxes/:id/open', engagementController.openMysteryBox);

// Stats
router.get('/stats', engagementController.getStats);

export default router;
