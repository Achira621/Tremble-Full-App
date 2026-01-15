import { Router } from 'express';
import { getUserProfile, updateProfile, searchUsers, updateProfileValidation, addVibe } from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

router.get('/search', searchUsers);
router.get('/:username', getUserProfile);
router.put('/profile', protect, validate(updateProfileValidation), updateProfile);
router.post('/vibe', protect, addVibe);

export default router;
