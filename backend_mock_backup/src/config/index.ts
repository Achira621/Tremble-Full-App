import dotenv from 'dotenv';

dotenv.config();

interface Config {
    port: number;
    nodeEnv: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    maxPhotosPerUser: number;
    maxCaptionLength: number;
    dailyDiscoveryLimit: number;
    staleMatchDays: number;
}

const config: Config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-this',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    maxPhotosPerUser: parseInt(process.env.MAX_PHOTOS_PER_USER || '6', 10),
    maxCaptionLength: parseInt(process.env.MAX_CAPTION_LENGTH || '150', 10),
    dailyDiscoveryLimit: parseInt(process.env.DAILY_DISCOVERY_LIMIT || '20', 10),
    staleMatchDays: parseInt(process.env.STALE_MATCH_DAYS || '7', 10),
};

// Validate required configuration
if (!process.env.JWT_SECRET && config.nodeEnv === 'production') {
    throw new Error('JWT_SECRET must be defined in production');
}

export default config;
