import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis';

// Create rate limiter based on Redis availability
const createRateLimiter = (windowMs: number, max: number, message: string) => {
    const config: any = {
        windowMs,
        max,
        message: {
            success: false,
            error: message,
        },
        standardHeaders: true,
        legacyHeaders: false,
        // Skip failed requests
        skipFailedRequests: true,
    };

    // Use Redis store if available for distributed rate limiting
    if (redis) {
        config.store = new RedisStore({
            // @ts-ignore - RedisStore types issue
            sendCommand: (...args: string[]) => redis.call(...args),
        });
    }

    return rateLimit(config);
};

// General API rate limiter - 100 requests per 15 minutes
export const apiLimiter = createRateLimiter(
    parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    'Too many requests from this IP, please try again later'
);

// Strict rate limiter for auth endpoints - 5 requests per 15 minutes
export const authLimiter = createRateLimiter(
    15 * 60 * 1000,
    5,
    'Too many authentication attempts, please try again later'
);

// Upload rate limiter - 10 uploads per hour
export const uploadLimiter = createRateLimiter(
    60 * 60 * 1000,
    10,
    'Too many upload requests, please try again later'
);

// Custom rate limiter per user
export const userRateLimiter = (_max: number = 50, _windowMinutes: number = 15) => {
    return (_req: Request, _res: Response, next: NextFunction) => {
        // This would use req.user.id for authenticated routes
        // For now, using IP-based limiting
        next();
    };
};

export default {
    apiLimiter,
    authLimiter,
    uploadLimiter,
    userRateLimiter,
};
