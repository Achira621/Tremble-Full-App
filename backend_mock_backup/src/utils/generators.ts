import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
    return uuidv4();
};

/**
 * Generate a random number between min and max (inclusive)
 */
export const randomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Shuffle an array randomly
 */
export const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

/**
 * Pick random items from an array
 */
export const pickRandom = <T>(array: T[], count: number): T[] => {
    const shuffled = shuffleArray(array);
    return shuffled.slice(0, Math.min(count, array.length));
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (date1: Date, date2: Date): number => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

/**
 * Check if a date is stale (older than specified days)
 */
export const isStale = (date: Date, days: number): boolean => {
    return daysBetween(date, new Date()) > days;
};

/**
 * Calculate match score between two users based on common interests
 */
export const calculateMatchScore = (
    userInterests: string[],
    otherInterests: string[]
): number => {
    const commonInterests = userInterests.filter(interest =>
        otherInterests.includes(interest)
    );
    const totalInterests = new Set([...userInterests, ...otherInterests]).size;

    if (totalInterests === 0) return 0;

    return Math.round((commonInterests.length / totalInterests) * 100);
};

/**
 * Find common interests between two users
 */
export const findCommonInterests = (
    userInterests: string[],
    otherInterests: string[]
): string[] => {
    return userInterests.filter(interest => otherInterests.includes(interest));
};

/**
 * Generate a random avatar URL
 */
export const generateAvatarUrl = (seed: number): string => {
    return `https://i.pravatar.cc/400?img=${seed}`;
};

/**
 * Generate a random photo URL
 */
export const generatePhotoUrl = (seed: number): string => {
    return `https://picsum.photos/400/600?random=${seed}`;
};

/**
 * Sleep for specified milliseconds (useful for simulating async operations)
 */
export const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
