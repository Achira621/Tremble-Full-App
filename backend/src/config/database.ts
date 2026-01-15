import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const connectDB = async (): Promise<void> => {
    try {
        const mongoURI = process.env.MONGODB_URI || '';

        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        // Optimized connection options for performance (Serverless/Vercel)
        const options = {
            maxPoolSize: 1, // Limit connection pool size for serverless
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000,
            family: 4, // Use IPv4
            retryWrites: true,
            w: 'majority' as const,
        };

        const conn = await mongoose.connect(mongoURI, options);

        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        logger.info(`Database: ${conn.connection.name}`);

        // Optimize Mongoose for production
        mongoose.set('strictQuery', true);

        // Connection event handlers
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        logger.error('Error connecting to MongoDB:', error);
        // Do not exit process in serverless, let the function fail naturally or retry
        // process.exit(1); 
        throw error;
    }
};

export default connectDB;
