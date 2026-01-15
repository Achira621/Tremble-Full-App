import { APP_CONSTANTS } from './constants';

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate username (alphanumeric, underscore, 3-20 chars)
 */
export const isValidUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
};

/**
 * Validate password strength (min 6 chars)
 */
export const isValidPassword = (password: string): boolean => {
    return password.length >= 6;
};

/**
 * Validate age
 */
export const isValidAge = (age: number): boolean => {
    return age >= APP_CONSTANTS.MIN_AGE && age <= APP_CONSTANTS.MAX_AGE;
};

/**
 * Validate bio length
 */
export const isValidBio = (bio: string): boolean => {
    return (
        bio.length >= APP_CONSTANTS.MIN_BIO_LENGTH &&
        bio.length <= APP_CONSTANTS.MAX_BIO_LENGTH
    );
};

/**
 * Validate caption length
 */
export const isValidCaption = (caption: string): boolean => {
    return (
        caption.length >= APP_CONSTANTS.MIN_CAPTION_LENGTH &&
        caption.length <= APP_CONSTANTS.MAX_CAPTION_LENGTH
    );
};

/**
 * Validate photo URL
 */
export const isValidPhotoUrl = (url: string): boolean => {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
};

/**
 * Validate interests array
 */
export const isValidInterests = (interests: string[]): boolean => {
    return (
        interests.length >= APP_CONSTANTS.MIN_INTERESTS_REQUIRED &&
        interests.length <= APP_CONSTANTS.MAX_INTERESTS
    );
};

/**
 * Sanitize string (remove extra whitespace)
 */
export const sanitizeString = (str: string): string => {
    return str.trim().replace(/\s+/g, ' ');
};

/**
 * Validate and sanitize user input
 */
export const sanitizeUserInput = (input: string): string => {
    return sanitizeString(input).slice(0, 1000); // Max 1000 chars for any input
};
