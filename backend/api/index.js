// Vercel serverless function wrapper for Express app
import app from '../server.js';

// Vercel handles Express apps automatically when exported as default
// The Express app will handle all /api/* routes
export default app;

