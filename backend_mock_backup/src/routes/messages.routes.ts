import { Router } from 'express';
import { body, param } from 'express-validator';
import * as messagesController from '../controllers/messages.controller';
import { authenticate } from '../middleware/auth';
import { validate, asyncHandler } from '../middleware/validation';

const router = Router();

/**
 * @route   GET /api/messages/conversations
 * @desc    Get all conversations
 * @access  Private
 */
router.get(
    '/conversations',
    authenticate,
    asyncHandler(messagesController.getConversations)
);

/**
 * @route   GET /api/messages/:otherUserId
 * @desc    Get messages with a specific user
 * @access  Private
 */
router.get(
    '/:otherUserId',
    authenticate,
    param('otherUserId').notEmpty(),
    validate,
    asyncHandler(messagesController.getMessages)
);

/**
 * @route   POST /api/messages/send
 * @desc    Send a message
 * @access  Private
 */
router.post(
    '/send',
    authenticate,
    [
        body('receiverId').notEmpty().withMessage('Receiver ID is required'),
        body('content').notEmpty().withMessage('Message content is required'),
        validate,
    ],
    asyncHandler(messagesController.sendMessage)
);

/**
 * @route   PUT /api/messages/:messageId/read
 * @desc    Mark message as read
 * @access  Private
 */
router.put(
    '/:messageId/read',
    authenticate,
    param('messageId').notEmpty(),
    validate,
    asyncHandler(messagesController.markAsRead)
);

/**
 * @route   GET /api/messages/icebreakers
 * @desc    Get icebreaker prompts
 * @access  Private
 */
router.get(
    '/icebreakers',
    authenticate,
    asyncHandler(messagesController.getIcebreakers)
);

export default router;
