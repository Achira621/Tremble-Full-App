import app from '../src/app';
import connectDB from '../src/config/database';

// Connect to database
// Note: In serverless, we don't await this at the top level to avoid cold start delays,
// but Mongoose buffers commands so it works.
connectDB();

export default app;
