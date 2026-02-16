import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { DailyStreak, Achievement, Notification } from '../models/Engagement';
import { AppError } from '../middleware/error.middleware';

// ==========================================
// Streaks
// ==========================================
export const getDailyStreak = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.id;
        let streak = await DailyStreak.findOne({ user: userId });

        if (!streak) {
            streak = await DailyStreak.create({ user: userId });
        }

        // Logic to check if streak is broken or needs update
        const now = new Date();
        const lastLogin = new Date(streak.lastLoginDate);
        const diffDays = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            // Consecutive day
            streak.currentStreak += 1;
            streak.lastLoginDate = now;
            if (streak.currentStreak > streak.longestStreak) {
                streak.longestStreak = streak.currentStreak;
            }
            await streak.save();
        } else if (diffDays > 1) {
            // Broken streak
            streak.currentStreak = 1;
            streak.lastLoginDate = now;
            await streak.save();
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
        const achievements = await Achievement.find({ user: userId });
        res.status(200).json({
            success: true,
            data: achievements
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
        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (error) {
        next(error);
    }
};

export const markNotificationRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await Notification.findOneAndUpdate(
            { _id: id, recipient: userId },
            { isRead: true }
        );

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
