import mongoose from 'mongoose';
import { logger } from '../utils/logger';

let isConnected = false;

const connectDB = async (): Promise<void> => {
    // Skip if already connected (for serverless reuse)
    if (isConnected && mongoose.connection.readyState === 1) {
        logger.info('Using existing MongoDB connection');
        return;
    }

    try {
        const mongoURI = process.env.MONGODB_URI || '';

        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        console.log('[DB] Connecting to MongoDB...');
        console.log('[DB] URI prefix:', mongoURI.substring(0, 30) + '...');

        // Optimized connection options for serverless/Vercel
        const options = {
            maxPoolSize: 1, // Limit connection pool size for serverless
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 15000, // Increased for cold starts
            connectTimeoutMS: 15000,
            family: 4, // Use IPv4
            retryWrites: true,
            w: 'majority' as const,
            bufferCommands: true, // Buffer commands while connecting
        };

        const conn = await mongoose.connect(mongoURI, options);
        isConnected = true;

        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        logger.info(`Database: ${conn.connection.name}`);
        console.log(`[DB] Connected to ${conn.connection.host}/${conn.connection.name}`);

        // Optimize Mongoose for production
        mongoose.set('strictQuery', true);

        // Connection event handlers
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
            isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
            isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
            isConnected = true;
        });

    } catch (error: any) {
        isConnected = false;
        console.error('[DB] Connection error:', error.message);
        logger.error('Error connecting to MongoDB:', error);
        throw error;
    }
};

export default connectDB;
