import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import postRoutes from './routes/post.routes';
import connectionRoutes from './routes/connection.routes';
import matchRoutes from './routes/match.routes';
import glimpseRoutes from './routes/glimpses.routes';
import engagementRoutes from './routes/engagement.routes';

// Middleware
import { errorHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/ratelimit.middleware';
import { logger } from './utils/logger';

const app: Application = express();

// Security middleware
app.use(helmet()); // Set security headers
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(hpp()); // Prevent HTTP parameter pollution

// CORS
const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
};
app.use(cors(corsOptions));

// Compression middleware for response optimization
app.use(compression());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: {
            write: (message: string) => logger.info(message.trim()),
        },
    }));
}

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// API routes with rate limiting
app.use('/api/auth', authRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/posts', apiLimiter, postRoutes);
app.use('/api/connections', apiLimiter, connectionRoutes);
app.use('/api/matches', apiLimiter, matchRoutes);
app.use('/api/glimpses', apiLimiter, glimpseRoutes);
app.use('/api/engagement', apiLimiter, engagementRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
    });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
