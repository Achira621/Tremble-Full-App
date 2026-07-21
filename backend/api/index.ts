import dotenv from 'dotenv';
import path from 'path';

// Load env vars - try backend/.env first, then root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import app from '../src/app';
import connectDB from '../src/config/database';

// Debug route - add BEFORE other routes to verify serverless function works
app.get('/api/debug', (_req, res) => {
    res.json({
        success: true,
        message: 'Serverless function is working!',
        env: {
            NODE_ENV: process.env.NODE_ENV,
            hasInsforgeUrl: !!(process.env.VITE_INSFORGE_URL || process.env.INSFORGE_URL),
            hasInsforgeKey: !!(process.env.VITE_INSFORGE_ANON_KEY || process.env.INSFORGE_ANON_KEY),
            hasJwtSecret: !!process.env.JWT_SECRET,
        },
        timestamp: new Date().toISOString(),
    });
});

// Connect to database with error handling
connectDB().catch((err) => {
    console.error('Database connection failed:', err.message);
});

export default app;
