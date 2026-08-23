import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import companyController from '../controllers/companyController.js';
import { UPLOAD_DIR } from '../config/constants.js';

const router = express.Router();
const upload = multer({ dest: UPLOAD_DIR });

// ── Smoke-test ────────────────────────────────────────────────────────────────
router.get('/test-router', (_req, res) => res.json({ message: 'router internal works' }));

// ── Auth ──────────────────────────────────────────────────────────────────────

/** POST /api/companies/register — register a new company (tenant) */
router.post('/register', (req, res) => companyController.register(req, res));

/** POST /api/companies/login — login as company */
router.post('/login', (req, res) => companyController.login(req, res));

// ── Profile ───────────────────────────────────────────────────────────────────

/** GET /api/companies/me — current company profile + dashboard data */
router.get('/me', authenticate, (req, res) => companyController.getProfile(req, res));

/** PUT /api/companies/profile — update company name, support email, category */
router.put('/profile', authenticate, (req, res) => companyController.updateProfile(req, res));

/** PUT /api/companies/config — update API stack integration & concept mappings */
router.put('/config', authenticate, (req, res) => companyController.updateConfig(req, res));

// ── Knowledge Base Documents ──────────────────────────────────────────────────

/** GET /api/companies/documents — list all documents (paginated) */
router.get('/documents', authenticate, (req, res) => companyController.getAllDocuments(req, res));

/** GET /api/companies/documents/:documentId — get a specific document */
router.get('/documents/:documentId', authenticate, (req, res) =>
  companyController.getDocumentById(req, res)
);

/** DELETE /api/companies/documents/:documentId — delete document + invalidate vector store */
router.delete('/documents/:documentId', authenticate, (req, res) =>
  companyController.deleteDocument(req, res)
);

/** POST /api/companies/upload — upload KB document + rebuild vector store */
router.post('/upload', authenticate, upload.single('file'), (req, res) =>
  companyController.uploadDocument(req, res)
);

// ── Inquiries ─────────────────────────────────────────────────────────────────

/** PATCH /api/companies/inquiries/:id/resolve — manually resolve inquiry */
router.patch('/inquiries/:id/resolve', authenticate, (req, res) =>
  companyController.resolveInquiry(req, res)
);

/** PATCH /api/companies/inquiries/:id/assign — assign ticket to a human executive */
router.patch('/inquiries/:id/assign', authenticate, (req, res) =>
  companyController.assignInquiry(req, res)
);

// ── Public (must be LAST — wildcard) ─────────────────────────────────────────

/** GET /api/companies/:companyId — public company details */
router.get('/:companyId', (req, res) => companyController.getCompanyDetails(req, res));

export default router;
