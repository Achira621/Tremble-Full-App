import { Response } from 'express';
import Match from '../models/Match';
import Connection from '../models/Connection';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';

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

        let match = await Match.findOne({
            $or: [
                { user1: currentUserId, user2: userId },
                { user1: userId, user2: currentUserId },
            ],
        });

        if (!match) {
            match = await Match.create({
                user1: currentUserId,
                user2: userId,
                user1Liked: true,
            });

            res.status(200).json({
                success: true,
                data: {
                    matched: false,
                    match,
                },
            });
        } else {
            if (match.user1.toString() === currentUserId) {
                match.user1Liked = true;
            } else {
                match.user2Liked = true;
            }

            if (match.user1Liked && match.user2Liked) {
                match.status = 'matched';
                match.matchedAt = new Date();
            }

            await match.save();

            if (match.status === 'matched') {
                await Connection.create({
                    follower: currentUserId,
                    following: userId,
                    status: 'accepted',
                });
                await Connection.create({
                    follower: userId,
                    following: currentUserId,
                    status: 'accepted',
                });

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

        let match = await Match.findOne({
            $or: [
                { user1: currentUserId, user2: userId },
                { user1: userId, user2: currentUserId },
            ],
        });

        if (!match) {
            match = await Match.create({
                user1: currentUserId,
                user2: userId,
                user1Liked: false,
                status: 'unmatched',
            });
        } else {
            if (match.user1.toString() === currentUserId) {
                match.user1Liked = false;
            } else {
                match.user2Liked = false;
            }
            match.status = 'unmatched';
            await match.save();
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

        const match = await Match.findOneAndUpdate(
            {
                $or: [
                    { user1: currentUserId, user2: userId },
                    { user1: userId, user2: currentUserId },
                ],
                status: 'matched',
            },
            { status: 'unmatched' },
            { new: true }
        );

        if (match) {
            await Connection.deleteMany({
                $or: [
                    { follower: currentUserId, following: userId },
                    { follower: userId, following: currentUserId },
                ],
            });
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

        const matches = await Match.find({
            $or: [{ user1: currentUserId }, { user2: currentUserId }],
            status: 'matched',
        }).populate('user1', 'username fullName photos avatar age')
         .populate('user2', 'username fullName photos avatar age');

        const formattedMatches = matches.map(match => {
            const otherUser = match.user1._id.toString() === currentUserId ? match.user2 : match.user1;
            return {
                matchId: match._id,
                user: otherUser,
                matchedAt: match.matchedAt,
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
