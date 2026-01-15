import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';

interface JwtPayload {
    id: string;
    username: string;
    email: string;
}

export const protect = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token: string | undefined;

        // Get token from Authorization header
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Not authorized to access this route',
            });
            return;
        }

        try {
            // Verify token
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'secret'
            ) as JwtPayload;

            // Attach user to request
            req.user = {
                id: decoded.id,
                username: decoded.username,
                email: decoded.email,
            };

            next();
        } catch (error) {
            res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
            });
        }
    } catch (error) {
        logger.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during authentication',
        });
    }
};
