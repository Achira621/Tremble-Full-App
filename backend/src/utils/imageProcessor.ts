import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { logger } from './logger';

export interface ImageProcessingOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Optimize and resize image for faster loading
 */
export const optimizeImage = async (
    inputPath: string,
    outputPath?: string,
    options: ImageProcessingOptions = {}
): Promise<string> => {
    try {
        const {
            width = 1080,
            height,
            quality = 80,
            format = 'webp', // WebP for better compression
        } = options;

        const output = outputPath || inputPath.replace(path.extname(inputPath), `.${format}`);

        await sharp(inputPath)
            .resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true,
            })
        [format]({ quality })
            .toFile(output);

        // Delete original if different from output
        if (output !== inputPath && fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath);
        }

        logger.info(`Image optimized: ${output}`);
        return output;
    } catch (error) {
        logger.error('Error optimizing image:', error);
        throw error;
    }
};

/**
 * Create thumbnail for faster preview loading
 */
export const createThumbnail = async (
    inputPath: string,
    size: number = 300
): Promise<string> => {
    try {
        const ext = path.extname(inputPath);
        const thumbnailPath = inputPath.replace(ext, `-thumb${ext}`);

        await sharp(inputPath)
            .resize(size, size, {
                fit: 'cover',
                position: 'center',
            })
            .webp({ quality: 70 })
            .toFile(thumbnailPath);

        logger.info(`Thumbnail created: ${thumbnailPath}`);
        return thumbnailPath;
    } catch (error) {
        logger.error('Error creating thumbnail:', error);
        throw error;
    }
};

/**
 * Get image metadata
 */
export const getImageMetadata = async (imagePath: string) => {
    try {
        const metadata = await sharp(imagePath).metadata();
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
