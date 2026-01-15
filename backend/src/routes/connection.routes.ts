import { Router } from 'express';
import { followUser, unfollowUser, getFollowers, getFollowing } from '../controllers/connection.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/follow/:userId', protect, followUser);
router.delete('/unfollow/:userId', protect, unfollowUser);
router.get('/followers/:userId', getFollowers);
router.get('/following/:userId', getFollowing);

export default router;
