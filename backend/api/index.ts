import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars - try backend/.env first, then root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Add debug route bypass directly in the handler wrapper
    if (req.url?.includes('/api/debug-test')) {
        return res.status(200).json({ success: true, message: "Debug Test works!" });
    }

    try {
        // Dynamically import the app and db to catch top-level initialization errors
        const appModule = await import('../src/app');
        const connectDB = (await import('../src/config/database')).default;
        
        // Connect to database with error handling
        await connectDB().catch((err: any) => {
            console.error('Database connection failed:', err.message);
        });
        
        // Express app handles the request
        const app = appModule.default;
        return app(req as any, res as any);
    } catch (err: any) {
        console.error("FATAL STARTUP ERROR:", err);
        return res.status(500).json({
            success: false,
            message: "Fatal startup error",
            error: err.message,
            stack: err.stack,
            name: err.name,
            code: err.code
        });
    }
}
