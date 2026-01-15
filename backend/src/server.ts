import dotenv from 'dotenv';
import app from './app';
import connectDB from './config/database';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Connect to database and start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start server
        const server = app.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
            logger.info(`Health check: http://localhost:${PORT}/health`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('SIGTERM signal received: closing HTTP server');
            server.close(() => {
                logger.info('HTTP server closed');
            });
        });

        process.on('unhandledRejection', (err: Error) => {
            logger.error('Unhandled Rejection:', err);
            server.close(() => process.exit(1));
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
