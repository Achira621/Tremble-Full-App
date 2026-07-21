import { Response } from 'express';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';
import { insforge } from '../config/database';

export const getDiscoveryFeed = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const currentUserId = req.user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        
        // Get users already matched with or passed
        const { data: matches, error: matchError } = await insforge
            .from('matches')
            .select('user1_id, user2_id')
            .or(user1_id.eq. + currentUserId + ,user2_id.eq. + currentUserId);

        if (matchError) throw matchError;

        let excludeIds = [currentUserId];
        if (matches) {
            matches.forEach(m => {
                excludeIds.push(m.user1_id === currentUserId ? m.user2_id : m.user1_id);
            });
        }
        
        // Ensure unique
        excludeIds = [...new Set(excludeIds)];

        const skip = (page - 1) * limit;

        const { data: users, error: userError, count } = await insforge
            .from('users')
            .select('id, username, full_name, age, bio, photos, interests', { count: 'exact' })
            // To do not in, we construct a filter. If the array is large, this might need an RPC, but we'll use not.in.
            .not('id', 'in', ( + excludeIds.join(',') + ))
            .range(skip, skip + limit - 1);

        if (userError) throw userError;

        const total = count || 0;

        const formattedUsers = (users || []).map(user => ({
            id: user.id,
            name: user.full_name || user.username,
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
                hasMore: skip + (users?.length || 0) < total,
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
