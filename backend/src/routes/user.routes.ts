import { Router } from 'express';
import { getUserProfile, updateProfile, searchUsers, updateProfileValidation, addVibe, uploadPhoto } from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/search', searchUsers);
router.get('/:username', getUserProfile);
router.put('/profile', protect, validate(updateProfileValidation), updateProfile);
router.post('/vibe', protect, addVibe);
router.post('/upload-photo', protect, upload.single('photo'), uploadPhoto);

export default router;
