import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { insforge } from '../config/database';

// ==========================================
// Streaks
// ==========================================
export const getDailyStreak = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.id;
        
        const { data: streaks, error: fetchError } = await insforge
            .from('daily_streaks')
            .select('*')
            .eq('user_id', userId)
            .single();

        let streak = streaks;

        if (fetchError || !streak) {
            const { data: newStreaks, error: createError } = await insforge
                .from('daily_streaks')
                .insert([{ user_id: userId }])
                .select();
                
            if (createError) throw createError;
            streak = newStreaks[0];
        }

        // Logic to check if streak is broken or needs update
        const now = new Date();
        const lastLogin = new Date(streak.last_login_date);
        const diffDays = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

        let currentStreak = streak.current_streak;
        let longestStreak = streak.longest_streak;
        let isUpdated = false;

        if (diffDays === 1) {
            // Consecutive day
            currentStreak += 1;
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }
            isUpdated = true;
        } else if (diffDays > 1) {
            // Broken streak
            currentStreak = 1;
            isUpdated = true;
        }

        if (isUpdated) {
            const { data: updatedStreaks, error: updateError } = await insforge
                .from('daily_streaks')
                .update({ current_streak: currentStreak, longest_streak: longestStreak, last_login_date: now.toISOString() })
                .eq('id', streak.id)
                .select();
                
            if (updateError) throw updateError;
            streak = updatedStreaks[0];
        }

        res.status(200).json({
            success: true,
            data: streak
        });
    } catch (error) {
        next(error);
    }
};

export const claimStreakReward = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Mock implementation for reward claiming
        res.status(200).json({
            success: true,
            message: 'Reward claimed!'
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Achievements
// ==========================================
export const getAchievements = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.id;
        const { data: achievements, error } = await insforge
            .from('achievements')
            .select('*')
            .eq('user_id', userId);
            
        if (error) throw error;

        res.status(200).json({
            success: true,
            data: achievements || []
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Notifications
// ==========================================
export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.id;
        const { data: notifications, error } = await insforge
            .from('notifications')
            .select('*')
            .eq('recipient_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);
            
        if (error) throw error;

        res.status(200).json({
            success: true,
            data: notifications || []
        });
    } catch (error) {
        next(error);
    }
};

export const markNotificationRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await insforge
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('recipient_id', userId);

        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Secret Admirers & Mystery Boxes (Mock Mongoose)
// ==========================================
export const getSecretAdmirers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Need a Like model to count hidden likes
    // For now, return mock count or 0
    res.status(200).json({
        success: true,
        data: { count: 3 } // Mock
    });
};

export const revealSecretAdmirer = async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        data: { name: 'Sarah', age: 24 } // Mock
    });
};

export const getMysteryBoxes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        data: []
    });
};

export const openMysteryBox = async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        data: { reward: '100 Coins' }
    });
};

export const getStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        data: { score: 85 }
    });
};
