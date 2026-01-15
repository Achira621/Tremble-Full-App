import express, { Application } from 'express';
import cors from 'cors';
import config from './config';
import { seedMockData } from './data/mockData';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import discoveryRoutes from './routes/discovery.routes';
import connectionsRoutes from './routes/connections.routes';
import messagesRoutes from './routes/messages.routes';
import postsRoutes from './routes/posts.routes';
import safetyRoutes from './routes/safety.routes';
import vibesRoutes from './routes/vibes.routes';
import engagementRoutes from './routes/engagement.routes';
import glimpsesRoutes from './routes/glimpses.routes';

const app: Application = express();

// ============================================
// MIDDLEWARE
// ============================================

// CORS
app.use(cors({
    origin: '*', // In production, specify allowed origins
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (simple)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Tremble API is running',
        timestamp: new Date().toISOString(),
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/vibes', vibesRoutes);
app.use('/api/engagement', engagementRoutes);
app.use('/api/glimpses', glimpsesRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// SERVER INITIALIZATION
// ============================================

const startServer = async (): Promise<void> => {
    try {
        // Seed mock data
        await seedMockData();

        // Start server
        app.listen(config.port, () => {
            console.log('');
            console.log('🚀 ========================================');
            console.log('🎉 Tremble Backend API Server Started!');
            console.log('========================================');
            console.log(`📍 Environment: ${config.nodeEnv}`);
            console.log(`🌐 Server: http://localhost:${config.port}`);
            console.log(`💚 Health: http://localhost:${config.port}/health`);
            console.log('========================================');
            console.log('');
            console.log('📚 Available Endpoints:');
            console.log('  Auth:        /api/auth/*');
            console.log('  Users:       /api/users/*');
            console.log('  Discovery:   /api/discovery/*');
            console.log('  Connections: /api/connections/*');
            console.log('  Messages:    /api/messages/*');
            console.log('  Posts:       /api/posts/*');
            console.log('  Safety:      /api/safety/*');
            console.log('  Vibes:       /api/vibes/*');
            console.log('  Engagement:  /api/engagement/* 🔥 NEW!');
            console.log('  Glimpses:    /api/glimpses/* 🎬 NEW!');
            console.log('========================================');
            console.log('========================================');
            console.log('');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

export default app;
