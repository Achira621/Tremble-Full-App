import { Router } from 'express';
import { likeUser, passUser, getMatches, unlikeUser } from '../controllers/match.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/like/:userId', protect, likeUser);
router.post('/pass/:userId', protect, passUser);
router.delete('/unlike/:userId', protect, unlikeUser);
router.get('/matches', protect, getMatches);

export default router;
