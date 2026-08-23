import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from the project root (two dirs above src/index.ts) + local backend .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });     // root Flowdesk/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });        // backend/.env (override)


import express from 'express';

import cors from 'cors';
import companyRoutes from './routes/company-new.js';
import chatRoutes from './routes/chat.js';          // Full 5-stage AI pipeline (Stage 1-5 + escalation)
import adminRoutes from './routes/admin.js';
import inquiryRoutes from './routes/inquiries.js';
import swaggerRoutes from './routes/swagger.js';
import mockCompanyRoutes from './routes/mock-company.js';

const app = express();
const port = process.env.PORT || 5001;

// CORS — allow all origins in development; restrict in production via ALLOWED_ORIGIN env
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check — used by deployment platforms (Railway, Render, Docker)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Flowdesk Backend API is running', version: '2.0.0' });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
//
// /api/companies   → company-new.ts  (auth, profile, documents, resolve, assign)
// /api             → chat.ts         (FULL AI pipeline: POST /api/chat + reasoning + executive reply)
// /api/admin       → admin.ts        (admin-protected super-admin endpoints)
// /api/inquiries   → inquiries.ts    (ticket management)
// /api/swagger     → swagger.ts      (swagger/openapi ingestion)
// /api/mock-company→ mock-company.ts (demo test data)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/companies/test-simple', (req, res) => res.json({ message: 'simple route works' }));
app.use('/api/companies', companyRoutes);
app.use('/api', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/swagger', swaggerRoutes);
app.use('/api/mock-company', mockCompanyRoutes);

// Global error handler — catches any unhandled errors and returns clean JSON
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

app.listen(port as number, '0.0.0.0', () => {
  console.log(`\n🚀 Flowdesk AI Support OS — Server running on http://0.0.0.0:${port}`);
  console.log(`   AI Chat API:        http://localhost:${port}/api/chat`);
  console.log(`   Mock Company API:   http://localhost:${port}/api/mock-company`);
  console.log(`   Health:             http://localhost:${port}/health\n`);
  if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: No AI API key found. Set GROQ_API_KEY or OPENAI_API_KEY in .env');
  }
  if (!process.env.ADMIN_SECRET) {
    console.warn('⚠️  WARNING: ADMIN_SECRET not set. Admin routes will reject all requests.');
  }
});
