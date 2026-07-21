import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { insforge } from '../config/database';

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

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        const { data: glimpses, error: createError } = await insforge
            .from('glimpses')
            .insert([{
                user_id: userId,
                photo_url: photoUrl,
                caption,
                mood: mood || 'vibing',
                location: location || null,
                music_track: musicTrack || null,
                tags: tags || [],
                expires_at: expiresAt
            }])
            .select();

        if (createError) throw createError;
        if (!glimpses || glimpses.length === 0) throw new Error('Create glimpse failed');

        res.status(201).json({
            success: true,
            data: glimpses[0]
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
        const { data: interactions, error: intError } = await insforge
            .from('glimpse_interactions')
            .select('glimpse_id')
            .eq('user_id', userId)
            .in('interaction_type', ['view', 'skip', 'like', 'tremble']);

        if (intError) throw intError;

        let viewedGlimpses: string[] = [];
        if (interactions) {
            viewedGlimpses = interactions.map(i => i.glimpse_id);
            // unique
            viewedGlimpses = [...new Set(viewedGlimpses)];
        }

        // 2. Fetch fresh glimpses
        let query = insforge
            .from('glimpses')
            .select('id, photo_url, caption, mood, location, music_track, views, likes, comments, trembles, created_at, user:users!user_id(id, full_name, profile_photo, age)')
            .eq('is_active', true)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(limit);

        if (viewedGlimpses.length > 0) {
            const excludeList = viewedGlimpses.join(',');
            query = query.not('id', 'in', ( + excludeList + ));
        }

        const { data: feed, error: feedError } = await query;
        if (feedError) throw feedError;

        // Optionally sort by virality score in memory instead of db to keep it simple
        const sortedFeed = (feed || []).sort((a: any, b: any) => {
            const scoreA = (a.likes || 0) + (a.comments || 0) + ((a.views || 0) / 10);
            const scoreB = (b.likes || 0) + (b.comments || 0) + ((b.views || 0) / 10);
            return scoreB - scoreA;
        });

        const formattedFeed = sortedFeed.map((item: any) => {
            const userObj = item.user || {};
            return {
                glimpse: {
                    id: item.id,
                    photoUrl: item.photo_url,
                    caption: item.caption,
                    mood: item.mood,
                    location: item.location,
                    musicTrack: item.music_track,
                    views: item.views,
                    likes: item.likes,
                    comments: item.comments,
                    trembles: item.trembles
                },
                user: {
                    id: userObj.id,
                    name: userObj.full_name,
                    avatar: userObj.profile_photo,
                    age: userObj.age
                },
                hasLiked: false,
                hasTrembled: false
            };
        });

        res.status(200).json({
            success: true,
            count: formattedFeed.length,
            data: formattedFeed
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

        const { data: existing, error: fetchError } = await insforge
            .from('glimpse_interactions')
            .select('*')
            .eq('glimpse_id', id)
            .eq('user_id', userId)
            .eq('interaction_type', 'view')
            .single();

        if (fetchError && fetchError.details && !fetchError.details.includes('0 rows')) {
             throw fetchError;
        }

        if (!existing) {
            await insforge.from('glimpse_interactions').insert([{
                glimpse_id: id,
                user_id: userId,
                interaction_type: 'view'
            }]);

            // Update glimpse views
            const { data: glimpse } = await insforge.from('glimpses').select('views').eq('id', id).single();
            if (glimpse) {
                await insforge.from('glimpses').update({ views: (glimpse.views || 0) + 1 }).eq('id', id);
            }
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

        const { data: existing, error: fetchError } = await insforge
            .from('glimpse_interactions')
            .select('*')
            .eq('glimpse_id', id)
            .eq('user_id', userId)
            .eq('interaction_type', 'like')
            .single();

        let liked = false;

        const { data: glimpse } = await insforge.from('glimpses').select('likes, user_id').eq('id', id).single();
        if (!glimpse) {
            throw new AppError('Glimpse not found', 404);
        }

        let currentLikes = glimpse.likes || 0;

        if (existing) {
            // Unlike
            await insforge.from('glimpse_interactions').delete().eq('id', existing.id);
            const newLikes = Math.max(0, currentLikes - 1);
            await insforge.from('glimpses').update({ likes: newLikes }).eq('id', id);
            liked = false;
        } else {
            // Like
            await insforge.from('glimpse_interactions').insert([{
                glimpse_id: id,
                user_id: userId,
                interaction_type: 'like'
            }]);
            
            await insforge.from('glimpses').update({ likes: currentLikes + 1 }).eq('id', id);
            liked = true;

            // Notify Creator
            if (glimpse.user_id !== userId) {
                await insforge.from('notifications').insert([{
                    recipient_id: glimpse.user_id,
                    sender_id: userId,
                    type: 'like',
                    title: 'New Like',
                    message: 'Someone liked your glimpse!',
                    data: { glimpseId: id }
                }]);
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

        // Check if already trembled
         const { data: existing } = await insforge
             .from('glimpse_interactions')
             .select('*')
             .eq('glimpse_id', id)
             .eq('user_id', userId)
             .eq('interaction_type', 'tremble')
             .single();

        if (!existing) {
             await insforge.from('glimpse_interactions').insert([{
                 glimpse_id: id,
                 user_id: userId,
                 interaction_type: 'tremble'
             }]);

             const { data: glimpse } = await insforge.from('glimpses').select('trembles, user_id').eq('id', id).single();
             if (glimpse) {
                 await insforge.from('glimpses').update({ trembles: (glimpse.trembles || 0) + 1 }).eq('id', id);
             }

             if (glimpse && glimpse.user_id !== userId) {
                 await insforge.from('notifications').insert([{
                     recipient_id: glimpse.user_id,
                     sender_id: userId,
                     type: 'tremble',
                     title: 'You Got Trembled! ',
                     message: 'Someone super-liked your glimpse!',
                     data: { glimpseId: id }
                 }]);
             }
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

        const { data: comments, error: commentError } = await insforge.from('glimpse_comments').insert([{
            glimpse_id: id,
            user_id: userId,
            content
        }]).select();

        if (commentError) throw commentError;

        const { data: glimpse } = await insforge.from('glimpses').select('comments').eq('id', id).single();
        if (glimpse) {
            await insforge.from('glimpses').update({ comments: (glimpse.comments || 0) + 1 }).eq('id', id);
        }

        res.status(201).json({ success: true, data: comments ? comments[0] : null });
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
        
        const { data: glimpses, error } = await insforge
            .from('glimpses')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            data: glimpses || []
        });
    } catch (error) {
        next(error);
    }
};
