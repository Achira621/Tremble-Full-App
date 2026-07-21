import sharp from 'sharp';
import { logger } from './logger';

export interface ImageProcessingOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Optimize and resize image buffer for faster loading
 */
export const optimizeImage = async (
    inputBuffer: Buffer,
    options: ImageProcessingOptions = {}
): Promise<Buffer> => {
    try {
        const {
            width = 1080,
            height,
            quality = 80,
            format = 'webp', // WebP for better compression
        } = options;

        const outputBuffer = await sharp(inputBuffer)
            .resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            [format]({ quality })
            .toBuffer();

        logger.info(`Image optimized successfully in memory`);
        return outputBuffer;
    } catch (error) {
        logger.error('Error optimizing image:', error);
        throw error;
    }
};

/**
 * Create thumbnail buffer for faster preview loading
 */
export const createThumbnail = async (
    inputBuffer: Buffer,
    size: number = 300
): Promise<Buffer> => {
    try {
        const thumbnailBuffer = await sharp(inputBuffer)
            .resize(size, size, {
                fit: 'cover',
                position: 'center',
            })
            .webp({ quality: 70 })
            .toBuffer();

        logger.info(`Thumbnail created successfully in memory`);
        return thumbnailBuffer;
    } catch (error) {
        logger.error('Error creating thumbnail:', error);
        throw error;
    }
};

/**
 * Get image metadata from buffer
 */
export const getImageMetadata = async (inputBuffer: Buffer) => {
    try {
        const metadata = await sharp(inputBuffer).metadata();
        return {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            size: metadata.size,
        };
    } catch (error) {
        logger.error('Error getting image metadata:', error);
        throw error;
    }
};

export default {
    optimizeImage,
    createThumbnail,
    getImageMetadata,
};
