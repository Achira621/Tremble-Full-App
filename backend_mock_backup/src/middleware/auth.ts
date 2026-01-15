import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { JwtPayload } from '../types';
import { AppError } from './errorHandler';
import { ERROR_MESSAGES } from '../utils/constants';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, 401);
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

        // Attach user to request
        req.user = decoded;

        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            next(new AppError(ERROR_MESSAGES.TOKEN_EXPIRED, 401));
        } else if (error.name === 'JsonWebTokenError') {
            next(new AppError(ERROR_MESSAGES.INVALID_TOKEN, 401));
        } else {
            next(error);
        }
    }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
            req.user = decoded;
        }

        next();
    } catch (error) {
        // Ignore errors for optional auth
        next();
    }
};
