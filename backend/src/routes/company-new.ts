import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import companyController from '../controllers/companyController.js';
import { UPLOAD_DIR } from '../config/constants.js';

const router = express.Router();
const upload = multer({ dest: UPLOAD_DIR });

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
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
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
    console.error("GET /me Error:", err);
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
// @desc    Delete document
router.delete('/documents/:documentId', authenticate, (req, res) => companyController.deleteDocument(req, res));

// @route   PUT /api/companies/config
// @desc    Update API Stack Integration & Concept Mappings
router.put('/config', authenticate, (req, res) => companyController.updateConfig(req, res));

// @route   PUT /api/companies/profile
// @desc    Update company profile (name, support email, category)
router.put('/profile', authenticate, (req, res) => companyController.updateProfile(req, res));

// @route   POST /api/companies/upload
// @desc    Upload knowledge base documents
router.post('/upload', authenticate, upload.single('file'), (req, res) => 
  companyController.uploadDocument(req, res)
);

// @route   GET /api/companies/:companyId
// @desc    Get public company details (must be LAST — wildcard catches everything)
router.get('/:companyId', (req, res) => {
  console.log(`[DEBUG] GET /api/companies/${req.params.companyId} hit`);
  return companyController.getCompanyDetails(req, res);
});

export default router;
