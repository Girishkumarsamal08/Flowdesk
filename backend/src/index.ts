import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env — root first, then local backend/.env for overrides
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });   // Flowdesk/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });      // backend/.env (override)

import express from 'express';
import cors from 'cors';
import { registerRoutes } from './routes/index.js';

const app = express();
const port = process.env.PORT || 5001;

// ── CORS ───────────────────────────────────────────────────────────────────────
// Allow all origins in development; restrict via ALLOWED_ORIGIN in production.
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(
  cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));

// ── Request logger ─────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} — ${req.method} ${req.url}`);
  next();
});

// ── Health check (used by Railway, Render, Docker, etc.) ──────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Flowdesk Backend API is running', version: '2.0.0' });
});

// ── API Routes ─────────────────────────────────────────────────────────────────
registerRoutes(app);

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(port as number, '0.0.0.0', () => {
  console.log(`\n🚀 Flowdesk AI Support OS — running on http://0.0.0.0:${port}`);
  console.log(`   Health:    http://localhost:${port}/health`);
  console.log(`   Chat API:  http://localhost:${port}/api/chat`);
  console.log(`   Companies: http://localhost:${port}/api/companies\n`);

  if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: No AI API key found. Set GROQ_API_KEY or OPENAI_API_KEY in .env');
  }
  if (!process.env.ADMIN_SECRET) {
    console.warn('⚠️  WARNING: ADMIN_SECRET not set. Admin routes will reject all requests.');
  }
});
