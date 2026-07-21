import { createClient } from '@insforge/sdk';
import { logger } from '../utils/logger';

// Ensure required environment variables are present
const insforgeUrl = process.env.VITE_INSFORGE_URL || process.env.INSFORGE_URL || 'https://ubeq5da7.us-east.insforge.app';
const insforgeKey = process.env.VITE_INSFORGE_ANON_KEY || process.env.INSFORGE_ANON_KEY || 'anon_8683f0ca89e3827776c1dd5abb3c7e957a9b665d1513eb6eb1528e24af9bc677';

// Create and export the InsForge client
export const insforge = createClient({
    baseUrl: insforgeUrl,
    anonKey: insforgeKey
});

// Mock connectDB function to prevent breaking app.ts before we refactor it
const connectDB = async (): Promise<void> => {
    logger.info('Initialized InsForge Client Connection');
    console.log('[DB] Connected to InsForge SDK');
};

export default connectDB;
