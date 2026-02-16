import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';

export const getDiscoveryFeed = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const currentUserId = req.user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        // Get current user to know who to exclude
        const currentUser = await User.findById(currentUserId);
        
        // Get users already matched with
        const Match = (await import('../models/Match')).default;
        const matchedUserIds = await Match.find({
            $or: [{ user1: currentUserId }, { user2: currentUserId }],
            status: { $in: ['matched', 'pending'] }
        }).then(matches => {
            return matches.map(m => 
                m.user1.toString() === currentUserId ? m.user2 : m.user1
            );
        });

        // Get users who have already been passed
        const passedUserIds = await Match.find({
            $or: [{ user1: currentUserId }, { user2: currentUserId }],
            status: 'unmatched'
        }).then(matches => {
            return matches.map(m => 
                m.user1.toString() === currentUserId ? m.user2 : m.user1
            );
        });

        // Exclude current user and already interacted users
        const excludeIds = [currentUserId, ...matchedUserIds, ...passedUserIds];

        const skip = (page - 1) * limit;

        const users = await User.find({
            _id: { $nin: excludeIds },
            isActive: { $ne: false }
        })
        .select('username fullName age bio photos interests')
        .skip(skip)
        .limit(limit)
        .lean();

        const total = await User.countDocuments({
            _id: { $nin: excludeIds },
            isActive: { $ne: false }
        });

        const formattedUsers = users.map(user => ({
            id: user._id,
            name: user.fullName || user.username,
            age: user.age || 25,
            bio: user.bio || '',
            interests: user.interests || [],
            photos: user.photos || [],
            username: user.username,
        }));

        res.status(200).json({
            success: true,
            data: {
                data: formattedUsers,
                page,
                limit,
                total,
                hasMore: skip + users.length < total,
            }
        });
    } catch (error: any) {
        logger.error('Discovery feed error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get discovery feed',
        });
    }
};

export default { getDiscoveryFeed };
