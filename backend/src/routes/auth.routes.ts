import { Router } from 'express';
import { signup, login, getMe, signupValidation, loginValidation } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { authLimiter } from '../middleware/ratelimit.middleware';

const router = Router();

// Apply rate limiting to auth routes
router.use(authLimiter);

router.post('/signup', validate(signupValidation), signup);
router.post('/login', validate(loginValidation), login);
router.get('/me', protect, getMe);

export default router;
