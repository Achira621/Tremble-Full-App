import { Request, Response } from 'express';
import { dataStore } from '../data/store';
import { ApiResponse, Message, Conversation, UserProfile, User } from '../types';
import { AppError } from '../middleware/errorHandler';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, ICEBREAKER_PROMPTS } from '../utils/constants';
import { generateId } from '../utils/generators';

/**
 * Convert User to UserProfile
 */
const toUserProfile = (user: User): UserProfile => {
    return {
        id: user.id,
        name: user.name,
        age: user.age,
        bio: user.bio,
        photos: user.photos,
        interests: user.interests,
        vibeBadges: user.vibeBadges,
        location: user.location?.enabled ? { city: user.location.city } : undefined,
    };
};

/**
 * Get all conversations for current user
 */
export const getConversations = (
    req: Request,
    res: Response<ApiResponse<Array<{ conversation: Conversation; otherUser: UserProfile; lastMessage?: Message }>>>
): void => {
    const userId = req.user!.userId;

    const conversations = dataStore.getUserConversations(userId);

    const conversationsWithData = conversations.map(conv => {
        const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
        const otherUser = dataStore.getUser(otherUserId);
        const messages = dataStore.getConversationMessages(conv.id);
        const lastMessage = messages[messages.length - 1];

        return {
            conversation: conv,
            otherUser: otherUser ? toUserProfile(otherUser) : null,
            lastMessage,
        };
    }).filter(c => c.otherUser !== null) as Array<{ conversation: Conversation; otherUser: UserProfile; lastMessage?: Message }>;

    res.json({
        success: true,
        data: conversationsWithData,
    });
};

/**
 * Get messages with a specific user
 */
export const getMessages = (
    req: Request,
    res: Response<ApiResponse<Message[]>>
): void => {
    const userId = req.user!.userId;
    const { otherUserId } = req.params;

    // Check if users are matched
    const match = dataStore.getMatchBetweenUsers(userId, otherUserId);
    if (!match || !match.isActive) {
        throw new AppError(ERROR_MESSAGES.NOT_MATCHED, 403);
    }

    const conversation = dataStore.getConversationBetweenUsers(userId, otherUserId);
    if (!conversation) {
        throw new AppError(ERROR_MESSAGES.CONVERSATION_NOT_FOUND, 404);
    }

    const messages = dataStore.getConversationMessages(conversation.id);

    // Mark messages as read
    messages.forEach(msg => {
        if (msg.receiverId === userId && !msg.isRead) {
            dataStore.updateMessage(msg.id, { isRead: true });
        }
    });

    // Reset unread count
    const updatedUnreadCount = { ...conversation.unreadCount, [userId]: 0 };
    dataStore.updateConversation(conversation.id, { unreadCount: updatedUnreadCount });

    res.json({
        success: true,
        data: messages,
    });
};

/**
 * Send a message
 */
export const sendMessage = (
    req: Request,
    res: Response<ApiResponse<Message>>
): void => {
    const userId = req.user!.userId;
    const { receiverId, content } = req.body;

    if (userId === receiverId) {
        throw new AppError('Cannot send message to yourself', 400);
    }

    // Check if users are matched
    const match = dataStore.getMatchBetweenUsers(userId, receiverId);
    if (!match || !match.isActive) {
        throw new AppError(ERROR_MESSAGES.NOT_MATCHED, 403);
    }

    const conversation = dataStore.getConversationBetweenUsers(userId, receiverId);
    if (!conversation) {
        throw new AppError(ERROR_MESSAGES.CONVERSATION_NOT_FOUND, 404);
    }

    // Create message
    const message: Message = {
        id: generateId(),
        conversationId: conversation.id,
        senderId: userId,
        receiverId,
        content: content.trim(),
        isRead: false,
        createdAt: new Date(),
    };
    dataStore.createMessage(message);

    // Update conversation
    const updatedUnreadCount = {
        ...conversation.unreadCount,
        [receiverId]: (conversation.unreadCount[receiverId] || 0) + 1,
    };
    dataStore.updateConversation(conversation.id, {
        lastMessageAt: new Date(),
        unreadCount: updatedUnreadCount,
    });

    // Update match last message time
    dataStore.updateMatch(match.id, { lastMessageAt: new Date() });

    res.json({
        success: true,
        message: SUCCESS_MESSAGES.MESSAGE_SENT,
        data: message,
    });
};

/**
 * Mark message as read
 */
export const markAsRead = (
    req: Request,
    res: Response<ApiResponse>
): void => {
    const userId = req.user!.userId;
    const { messageId } = req.params;

    const message = dataStore.getMessage(messageId);
    if (!message) {
        throw new AppError(ERROR_MESSAGES.MESSAGE_NOT_FOUND, 404);
    }

    if (message.receiverId !== userId) {
        throw new AppError(ERROR_MESSAGES.FORBIDDEN, 403);
    }

    dataStore.updateMessage(messageId, { isRead: true });

    res.json({
        success: true,
        message: 'Message marked as read',
    });
};

/**
 * Get icebreaker prompts
 */
export const getIcebreakers = (
    req: Request,
    res: Response<ApiResponse<typeof ICEBREAKER_PROMPTS>>
): void => {
    res.json({
        success: true,
        data: ICEBREAKER_PROMPTS,
    });
};
