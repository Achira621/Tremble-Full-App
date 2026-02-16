import { Router } from 'express';
import { getDiscoveryFeed } from '../controllers/discovery.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/feed', protect, getDiscoveryFeed);

export default router;
