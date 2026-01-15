import { Router } from 'express';
import * as glimpseController from '../controllers/glimpses.controller';
import { protect } from '../middleware/auth.middleware'; // Assuming Finsta has this

const router = Router();

// Apply auth middleware to all routes
router.use(protect);

router.post('/', glimpseController.createGlimpse);
router.get('/feed', glimpseController.getFeed);
router.get('/my', glimpseController.getMyGlimpses);

router.post('/:id/view', glimpseController.recordView);
router.post('/:id/like', glimpseController.likeGlimpse);
router.post('/:id/tremble', glimpseController.trembleGlimpse);
router.post('/:id/comment', glimpseController.commentGlimpse);

export default router;
