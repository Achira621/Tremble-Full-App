import { Router } from 'express';
import { body, param } from 'express-validator';
import * as postsController from '../controllers/posts.controller';
import { authenticate } from '../middleware/auth';
import { validate, asyncHandler } from '../middleware/validation';

const router = Router();

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private
 */
router.post(
    '/',
    authenticate,
    [
        body('photoUrl').isURL().withMessage('Valid photo URL is required'),
        body('caption').notEmpty().withMessage('Caption is required'),
        validate,
    ],
    asyncHandler(postsController.createPost)
);

/**
 * @route   GET /api/posts/feed
 * @desc    Get feed of posts from connections
 * @access  Private
 */
router.get(
    '/feed',
    authenticate,
    asyncHandler(postsController.getFeed)
);

/**
 * @route   GET /api/posts/:postId
 * @desc    Get a single post
 * @access  Private
 */
router.get(
    '/:postId',
    authenticate,
    param('postId').notEmpty(),
    validate,
    asyncHandler(postsController.getPost)
);

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Get user's posts
 * @access  Private
 */
router.get(
    '/user/:userId',
    authenticate,
    param('userId').notEmpty(),
    validate,
    asyncHandler(postsController.getUserPosts)
);

/**
 * @route   DELETE /api/posts/:postId
 * @desc    Delete a post
 * @access  Private
 */
router.delete(
    '/:postId',
    authenticate,
    param('postId').notEmpty(),
    validate,
    asyncHandler(postsController.deletePost)
);

export default router;
