import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Check if Redis is enabled
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

let redisClient: Redis | null = null;

const connectRedis = (): Redis | null => {
    if (!REDIS_ENABLED) {
        logger.info('Redis caching is disabled');
        return null;
    }

    try {
        const redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
            logger.warn('REDIS_URL not provided. Running without cache.');
            return null;
        }

        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            enableOfflineQueue: false,
            lazyConnect: true,
        });

        redisClient.on('connect', () => {
            logger.info('Redis connected successfully');
        });

        redisClient.on('error', (err) => {
            logger.error('Redis error:', err);
        });

        redisClient.connect().catch((err) => {
            logger.error('Redis connection failed:', err);
            redisClient = null;
        });

        return redisClient;
    } catch (error) {
        logger.error('Error setting up Redis:', error);
        return null;
    }
};

// Initialize Redis
const redis = connectRedis();

export default redis;
