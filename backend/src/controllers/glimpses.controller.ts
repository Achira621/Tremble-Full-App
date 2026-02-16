import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import Glimpse from '../models/Glimpse';
import { GlimpseInteraction, GlimpseComment } from '../models/GlimpseInteraction';
import User from '../models/User';
import { Notification } from '../models/Engagement';
import { AppError } from '../middleware/error.middleware';
import mongoose from 'mongoose';

// ==========================================
// Create Glimpse
// ==========================================
export const createGlimpse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { caption, mood, location, musicTrack, tags } = req.body;
        const userId = req.user.id;

        // Get photo URL from uploaded file (Cloudinary returns it in req.file)
        if (!req.file) {
            throw new AppError('Photo is required', 400);
        }

        const photoUrl = (req.file as any).path; // Cloudinary stores URL in 'path' property

        const glimpse = await Glimpse.create({
            user: userId,
            photoUrl,
            caption,
            mood: mood || 'vibing',
            location,
            musicTrack,
            tags: tags || [],
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h default
        });

        // Add 'posted_glimpse' achievement logic here later if needed

        res.status(201).json({
            success: true,
            data: glimpse
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Get Feed (The Algorithm)
// ==========================================
export const getFeed = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit as string) || 10;

        // 1. Get IDs of glimpses already viewed by this user to exclude them
        const viewedGlimpses = await GlimpseInteraction.find({
            user: userId,
            type: { $in: ['view', 'skip', 'like', 'tremble'] }
        }).distinct('glimpse');

        // 2. Fetch fresh glimpses not viewed yet
        // Scoring Algorithm Implementation via Aggregation Pipeline could be complex, 
        // for now we use a simpler approach: Standard query with sort

        // Priority:
        // - Not viewed (filtered above)
        // - Recent (created within last 48h)
        // - High engagement (likes + views)
        // - Matching mood (if user preference exists - omitted for MVP)

        const feed = await Glimpse.aggregate([
            {
                $match: {
                    _id: { $nin: viewedGlimpses },
                    isActive: true,
                    expiresAt: { $gt: new Date() } // Not expired
                }
            },
            {
                $addFields: {
                    viralityScore: { $add: ["$likes", "$comments", { $divide: ["$views", 10] }] }
                }
            },
            { $sort: { viralityScore: -1, createdAt: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'items' // temp name
                }
            },
            { $unwind: '$items' },
            // Project user fields similar to populate
            {
                $project: {
                    _id: 1,
                    photoUrl: 1,
                    caption: 1,
                    mood: 1,
                    location: 1,
                    musicTrack: 1,
                    views: 1, likes: 1, comments: 1, trembles: 1,
                    user: {
                        _id: '$items._id',
                        name: '$items.name',
                        avatar: '$items.avatar', // Assuming user model has avatar
                        age: '$items.age'
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            count: feed.length,
            data: feed.map(item => ({
                glimpse: item,
                user: item.user,
                // Add hasLiked checks here if needed (requires another query or lookup)
                hasLiked: false,
                hasTrembled: false
            }))
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// Interactions
// ==========================================
export const recordView = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if already viewed
        const existing = await GlimpseInteraction.findOne({ glimpse: id, user: userId, type: 'view' });
        if (!existing) {
            await GlimpseInteraction.create({ glimpse: id, user: userId, type: 'view' });
            await Glimpse.findByIdAndUpdate(id, { $inc: { views: 1 } });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
};

export const likeGlimpse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const existing = await GlimpseInteraction.findOne({ glimpse: id, user: userId, type: 'like' });

        let liked = false;
        if (existing) {
            // Unlike
            await GlimpseInteraction.findByIdAndDelete(existing._id);
            await Glimpse.findByIdAndUpdate(id, { $inc: { likes: -1 } });
            liked = false;
        } else {
            // Like
            await GlimpseInteraction.create({ glimpse: id, user: userId, type: 'like' });
            await Glimpse.findByIdAndUpdate(id, { $inc: { likes: 1 } });
            liked = true;

            // Notify Creator
            const glimpse = await Glimpse.findById(id);
            if (glimpse && glimpse.user.toString() !== userId) {
                await Notification.create({
                    recipient: glimpse.user,
                    sender: userId,
                    type: 'like',
                    title: 'New Like',
                    message: 'Someone liked your glimpse!',
                    data: { glimpseId: id }
                });
            }
        }

        res.status(200).json({ success: true, liked });
    } catch (error) {
        next(error);
    }
};

export const trembleGlimpse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Create Tremble interaction
        await GlimpseInteraction.create({ glimpse: id, user: userId, type: 'tremble' });
        await Glimpse.findByIdAndUpdate(id, { $inc: { trembles: 1 } });

        // Logic for Match creation (Mutual Tremble) would go here
        // For MVP, just notify
        const glimpse = await Glimpse.findById(id);
        if (glimpse && glimpse.user.toString() !== userId) {
            await Notification.create({
                recipient: glimpse.user,
                sender: userId,
                type: 'tremble',
                title: 'You Got Trembled! ⚡',
                message: 'Someone super-liked your glimpse!',
                data: { glimpseId: id }
            });
        }

        res.status(200).json({ success: true, matched: false });
    } catch (error) {
        next(error);
    }
};

export const commentGlimpse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        const comment = await GlimpseComment.create({
            glimpse: id,
            user: userId,
            content
        });

        await Glimpse.findByIdAndUpdate(id, { $inc: { comments: 1 } });

        res.status(201).json({ success: true, data: comment });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Get User Glimpses
// ==========================================
export const getMyGlimpses = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.id;
        const glimpses = await Glimpse.find({ user: userId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: glimpses
        });
    } catch (error) {
        next(error);
    }
};
