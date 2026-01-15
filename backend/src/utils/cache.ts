import redis from '../config/redis';
import { logger } from './logger';

const DEFAULT_TTL = 3600; // 1 hour in seconds

/**
 * Cache utility class for Redis operations
 */
class CacheService {
    /**
     * Get value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        if (!redis) return null;

        try {
            const data = await redis.get(key);
            if (!data) return null;

            return JSON.parse(data) as T;
        } catch (error) {
            logger.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set value in cache
     */
    async set(key: string, value: any, ttl: number = DEFAULT_TTL): Promise<boolean> {
        if (!redis) return false;

        try {
            await redis.setex(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            logger.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete key from cache
     */
    async del(key: string): Promise<boolean> {
        if (!redis) return false;

        try {
            await redis.del(key);
            return true;
        } catch (error) {
            logger.error(`Cache delete error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete keys matching pattern
     */
    async delPattern(pattern: string): Promise<number> {
        if (!redis) return 0;

        try {
            const keys = await redis.keys(pattern);
            if (keys.length === 0) return 0;

            await redis.del(...keys);
            return keys.length;
        } catch (error) {
            logger.error(`Cache delete pattern error for ${pattern}:`, error);
            return 0;
        }
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        if (!redis) return false;

        try {
            const exists = await redis.exists(key);
            return exists === 1;
        } catch (error) {
            logger.error(`Cache exists error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Get or set pattern - fetch from cache or execute function and cache result
     */
    async getOrSet<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttl: number = DEFAULT_TTL
    ): Promise<T> {
        // Try to get from cache
        const cached = await this.get<T>(key);
        if (cached !== null) {
            logger.debug(`Cache hit for key: ${key}`);
            return cached;
        }

        // Fetch fresh data
        logger.debug(`Cache miss for key: ${key}`);
        const data = await fetchFn();

        // Store in cache
        await this.set(key, data, ttl);

        return data;
    }
}

export default new CacheService();
