import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import companyController from '../controllers/companyController.js';
import { UPLOAD_DIR } from '../config/constants.js';
import { invalidateVectorStore } from '../utils/vectorStore.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const upload = multer({ dest: UPLOAD_DIR });
const prisma = new PrismaClient();

router.get('/test-router', (req, res) => res.json({ message: 'router internal works' }));

// @route   POST /api/companies/register
// @desc    Register a new company (tenant)
router.post('/register', (req, res) => companyController.register(req, res));

// @route   POST /api/companies/login
// @desc    Login company (tenant)
router.post('/login', (req, res) => companyController.login(req, res));

// @route   GET /api/companies/me
// @desc    Get current company profile & dashboard info
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.companyId },
      select: {
        id: true,
        email: true,
        companyName: true,
        category: true,
        domain: true,
        supportEmail: true,
        apiBaseUrl: true,
        apiAuthType: true,
        apiAuthToken: true,
        apiHeaders: true,
        dataMappings: true,
        swaggerSchema: true,
        parsedEndpoints: true,
        kbDocuments: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            createdAt: true,
          }
        },
        inquiries: {
          orderBy: { createdAt: 'desc' },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' }
            },
            reasoningLogs: {
              orderBy: { timestamp: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json(company);
  } catch (err: any) {
    console.error('GET /me Error:', err);
    res.status(500).json({ message: 'Server error retrieving profile', error: err.message });
  }
});

// @route   GET /api/companies/documents
// @desc    Get all documents for company
router.get('/documents', authenticate, (req, res) => companyController.getAllDocuments(req, res));

// @route   GET /api/companies/documents/:documentId
// @desc    Get specific document
router.get('/documents/:documentId', authenticate, (req, res) => companyController.getDocumentById(req, res));

// @route   DELETE /api/companies/documents/:documentId
// @desc    Delete document + invalidate vector store so AI uses fresh data
router.delete('/documents/:documentId', authenticate, async (req: any, res) => {
  try {
    const { documentId } = req.params;
    const companyId = req.companyId;
    const fs = await import('fs');

    const doc = await prisma.kBDocument.findUnique({ where: { id: documentId } });
    if (!doc || doc.companyId !== companyId) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete physical file if it exists
    if (doc.filePath && fs.default.existsSync(doc.filePath)) {
      fs.default.unlinkSync(doc.filePath);
    }

    await prisma.kBDocument.delete({ where: { id: documentId } });

    // Invalidate vector store so AI uses fresh data on next chat
    invalidateVectorStore(companyId);

    res.json({ message: 'Document deleted successfully' });
  } catch (err: any) {
    console.error('DELETE /documents error:', err);
    res.status(500).json({ message: 'Failed to delete document', error: err.message });
  }
});

// @route   PUT /api/companies/config
// @desc    Update API Stack Integration & Concept Mappings
router.put('/config', authenticate, (req, res) => companyController.updateConfig(req, res));

// @route   PUT /api/companies/profile
// @desc    Update company profile (name, support email, category)
router.put('/profile', authenticate, (req, res) => companyController.updateProfile(req, res));

// @route   POST /api/companies/upload
// @desc    Upload knowledge base documents + rebuild vector store
router.post('/upload', authenticate, upload.single('file'), async (req: any, res) => {
  const companyId = req.companyId;
  try {
    // Wrap controller call — it handles parsing + DB save + sends response
    // We use a patched res.json to hook in vector store invalidation before sending
    const originalJson = res.json.bind(res);
    (res as any).json = function (body: any) {
      // Invalidate so AI picks up new doc on the very next chat
      invalidateVectorStore(companyId);
      return originalJson(body);
    };
    await companyController.uploadDocument(req, res);
  } catch (err: any) {
    console.error('POST /upload error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to upload document', error: err.message });
    }
  }
});

// @route   PATCH /api/companies/inquiries/:id/resolve
// @desc    Resolve an inquiry manually by an executive
router.patch('/inquiries/:id/resolve', authenticate, async (req: any, res) => {
  try {
    const inquiry = await prisma.inquiry.findFirst({
      where: { id: req.params.id, companyId: req.companyId }
    });

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    const updatedInquiry = await prisma.inquiry.update({
      where: { id: req.params.id },
      data: { status: 'resolved_human' }
    });

    await prisma.message.create({
      data: {
        inquiryId: req.params.id,
        sender: 'human',
        content: '[Ticket resolved manually by Executive]'
      }
    });

    res.json({ message: 'Inquiry resolved', inquiry: updatedInquiry });
  } catch (err: any) {
    console.error('Resolve Inquiry Error:', err);
    res.status(500).json({ message: 'Failed to resolve inquiry', error: err.message });
  }
});

// @route   PATCH /api/companies/inquiries/:id/assign
// @desc    Assign ticket to a human executive
router.patch('/inquiries/:id/assign', authenticate, async (req: any, res) => {
  try {
    const { executiveName } = req.body;

    const inquiry = await prisma.inquiry.findFirst({
      where: { id: req.params.id, companyId: req.companyId }
    });

    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

    const updated = await prisma.inquiry.update({
      where: { id: req.params.id },
      data: {
        assignedTo: executiveName || 'Support Executive',
        status: 'escalated'
      }
    });

    res.json({ message: 'Inquiry assigned', inquiry: updated });
  } catch (err: any) {
    console.error('Assign Ticket Error:', err);
    res.status(500).json({ message: 'Failed to assign ticket', error: err.message });
  }
});

// @route   GET /api/companies/:companyId
// @desc    Get public company details (must be LAST — wildcard catches everything)
router.get('/:companyId', (req, res) => {
  console.log(`[DEBUG] GET /api/companies/${req.params.companyId} hit`);
  return companyController.getCompanyDetails(req, res);
});

export default router;
