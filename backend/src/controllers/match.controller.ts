import { Response } from 'express';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';
import { insforge } from '../config/database';

export const likeUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const currentUserId = req.user.id;
        const { userId } = req.params;

        if (currentUserId === userId) {
            res.status(400).json({
                success: false,
                error: 'Cannot like yourself',
            });
            return;
        }

        const { data: matches, error: fetchError } = await insforge.database
            .from('matches')
            .select('*')
            .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${currentUserId})`);

        if (fetchError) throw fetchError;
        let match = matches && matches.length > 0 ? matches[0] : null;

        if (!match) {
            const { data: newMatches, error: createError } = await insforge.database
                .from('matches')
                .insert([{
                    user1_id: currentUserId,
                    user2_id: userId,
                    user1_liked: true
                }])
                .select();
                
            if (createError) throw createError;
            match = newMatches[0];

            res.status(200).json({
                success: true,
                data: {
                    matched: false,
                    match,
                },
            });
        } else {
            let u1Liked = match.user1_liked;
            let u2Liked = match.user2_liked;
            let newStatus = match.status;
            let matchedAt = match.matched_at;

            if (match.user1_id === currentUserId) {
                u1Liked = true;
            } else {
                u2Liked = true;
            }

            if (u1Liked && u2Liked) {
                newStatus = 'matched';
                matchedAt = new Date().toISOString();
            }

            const { data: updatedMatches, error: updateError } = await insforge.database
                .from('matches')
                .update({ user1_liked: u1Liked, user2_liked: u2Liked, status: newStatus, matched_at: matchedAt })
                .eq('id', match.id)
                .select();

            if (updateError) throw updateError;
            match = updatedMatches[0];

            if (match.status === 'matched') {
                await insforge.database.from('connections').insert([
                    { follower_id: currentUserId, following_id: userId, status: 'accepted' },
                    { follower_id: userId, following_id: currentUserId, status: 'accepted' }
                ]);

                logger.info(`New match: ${currentUserId} matched with ${userId}`);
            }

            res.status(200).json({
                success: true,
                data: {
                    matched: match.status === 'matched',
                    match,
                },
            });
        }
    } catch (error: any) {
        logger.error('Like user error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to like user',
        });
    }
};

export const passUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const currentUserId = req.user.id;
        const { userId } = req.params;

        const { data: matches, error: fetchError } = await insforge.database
            .from('matches')
            .select('*')
            .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${currentUserId})`);

        if (fetchError) throw fetchError;
        let match = matches && matches.length > 0 ? matches[0] : null;

        if (!match) {
            await insforge.database
                .from('matches')
                .insert([{
                    user1_id: currentUserId,
                    user2_id: userId,
                    user1_liked: false,
                    status: 'unmatched',
                }]);
        } else {
            let u1Liked = match.user1_liked;
            let u2Liked = match.user2_liked;

            if (match.user1_id === currentUserId) {
                u1Liked = false;
            } else {
                u2Liked = false;
            }
            
            await insforge.database
                .from('matches')
                .update({ user1_liked: u1Liked, user2_liked: u2Liked, status: 'unmatched' })
                .eq('id', match.id);
        }

        res.status(200).json({
            success: true,
            data: { passed: true },
        });
    } catch (error: any) {
        logger.error('Pass user error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to pass user',
        });
    }
};

export const unlikeUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const currentUserId = req.user.id;
        const { userId } = req.params;

        const { data: matches, error: fetchError } = await insforge.database
            .from('matches')
            .select('*')
            .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${currentUserId})`)
            .eq('status', 'matched');

        if (fetchError) throw fetchError;

        if (matches && matches.length > 0) {
            const match = matches[0];
            await insforge.database
                .from('matches')
                .update({ status: 'unmatched' })
                .eq('id', match.id);

            await insforge.database
                .from('connections')
                .delete()
                .or(`and(follower_id.eq.${currentUserId},following_id.eq.${userId}),and(follower_id.eq.${userId},following_id.eq.${currentUserId})`);
        }

        res.status(200).json({
            success: true,
            data: { unmatched: true },
        });
    } catch (error: any) {
        logger.error('Unlike user error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to unlike user',
        });
    }
};

export const getMatches = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const currentUserId = req.user.id;

        const { data: matches, error } = await insforge.database
            .from('matches')
            .select('id, matched_at, user1:users!user1_id(id, username, full_name, profile_photo, age), user2:users!user2_id(id, username, full_name, profile_photo, age)')
            .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
            .eq('status', 'matched');

        if (error) throw error;

        const formattedMatches = (matches || []).map((match: any) => {
            const otherUser = match.user1.id === currentUserId ? match.user2 : match.user1;
            return {
                matchId: match.id,
                user: otherUser,
                matchedAt: match.matched_at,
            };
        });

        res.status(200).json({
            success: true,
            data: formattedMatches,
        });
    } catch (error: any) {
        logger.error('Get matches error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get matches',
        });
    }
};

export default {
    likeUser,
    passUser,
    unlikeUser,
    getMatches,
};
