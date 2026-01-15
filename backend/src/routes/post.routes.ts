import { Router } from 'express';
import { createPost, getFeed, toggleLike, getUserPosts, createPostValidation } from '../controllers/post.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { upload } from '../middleware/upload.middleware';
import { uploadLimiter } from '../middleware/ratelimit.middleware';

const router = Router();

router.post('/', protect, uploadLimiter, upload.single('media'), validate(createPostValidation), createPost);
router.get('/feed', protect, getFeed);
router.post('/:postId/like', protect, toggleLike);
router.get('/user/:username', getUserPosts);

export default router;
