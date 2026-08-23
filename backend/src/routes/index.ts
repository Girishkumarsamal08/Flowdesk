/**
 * routes/index.ts
 * Central route aggregator — imported by src/index.ts.
 * Add new routers here; never scatter app.use() calls across the codebase.
 */
import type { Application } from 'express';
import companyRoutes from './company.js';
import chatRoutes from './chat.js';
import adminRoutes from './admin.js';
import inquiryRoutes from './inquiries.js';
import swaggerRoutes from './swagger.js';
import mockCompanyRoutes from './mock-company.js';

export function registerRoutes(app: Application): void {
  // Smoke-test shortcut (avoids wildcard route collision)
  app.get('/api/companies/test-simple', (_req, res) =>
    res.json({ message: 'simple route works' })
  );

  // ─── Feature routes ────────────────────────────────────────────────────────
  // /api/companies   → company.ts  (auth, profile, documents, resolve, assign)
  // /api             → chat.ts     (full 5-stage AI pipeline: chat + reasoning)
  // /api/admin       → admin.ts    (admin-protected super-admin endpoints)
  // /api/inquiries   → inquiries.ts (ticket management)
  // /api/swagger     → swagger.ts  (swagger/openapi ingestion)
  // /api/mock-company→ mock-company.ts (demo/test data)
  app.use('/api/companies', companyRoutes);
  app.use('/api', chatRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/inquiries', inquiryRoutes);
  app.use('/api/swagger', swaggerRoutes);
  app.use('/api/mock-company', mockCompanyRoutes);
}
