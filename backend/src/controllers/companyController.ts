import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { createRequire } from 'module';
import authService from '../services/authService.js';
import { UPLOAD_DIR } from '../config/constants.js';
import { invalidateVectorStore } from '../utils/vectorStore.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const prisma = new PrismaClient();

export class CompanyController {
  // ──────────────────────────────────────────────
  // Auth
  // ──────────────────────────────────────────────

  async register(req: any, res: any) {
    try {
      const { email, password, companyName, category } = req.body;

      if (!email || !password || !companyName || !category) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const company = await authService.registerCompany(email, password, companyName, category);
      res.status(201).json({
        message: 'Company registered successfully',
        company: { id: company.id, email: company.email },
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async login(req: any, res: any) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }

      const { company, token } = await authService.loginCompany(email, password);
      res.json({
        message: 'Login successful',
        token,
        company: { id: company.id, email: company.email, companyName: company.companyName },
      });
    } catch (err: any) {
      res.status(401).json({ message: err.message });
    }
  }

  // ──────────────────────────────────────────────
  // Profile
  // ──────────────────────────────────────────────

  /**
   * GET /api/companies/me
   * Returns the authenticated company's full profile + dashboard data.
   */
  async getProfile(req: any, res: any) {
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
            },
          },
          inquiries: {
            orderBy: { createdAt: 'desc' },
            include: {
              messages: { orderBy: { createdAt: 'asc' } },
              reasoningLogs: {
                orderBy: { timestamp: 'desc' },
                take: 1,
              },
            },
          },
        },
      });

      if (!company) return res.status(404).json({ message: 'Company not found' });
      res.json(company);
    } catch (err: any) {
      console.error('GET /me Error:', err);
      res.status(500).json({ message: 'Server error retrieving profile', error: err.message });
    }
  }

  async updateProfile(req: any, res: any) {
    try {
      const companyId = req.companyId;
      const { companyName, supportEmail, category } = req.body;

      const updates: any = {};
      if (companyName) updates.companyName = companyName;
      if (supportEmail) updates.supportEmail = supportEmail;
      if (category) updates.category = category;

      const updated = await prisma.company.update({
        where: { id: companyId },
        data: updates,
      });

      res.json({ message: 'Company profile updated successfully', company: updated });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async updateConfig(req: any, res: any) {
    try {
      const companyId = req.companyId;
      const updates = req.body;

      const updated = await authService.updateCompanyConfig(companyId!, updates);
      res.json({ message: 'Company config updated', company: updated });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  // ──────────────────────────────────────────────
  // Documents
  // ──────────────────────────────────────────────

  async uploadDocument(req: any, res: any) {
    try {
      const companyId = req.companyId;
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const file = req.file;
      let content = '';

      if (file.mimetype === 'application/pdf') {
        const dataBuffer = fs.readFileSync(file.path);
        const data = await pdfParse(dataBuffer);
        content = data.text;
      } else if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/msword'
      ) {
        const result = await mammoth.extractRawText({ path: file.path });
        content = result.value;
      } else {
        content = fs.readFileSync(file.path, 'utf-8');
      }

      const doc = await prisma.kBDocument.create({
        data: {
          companyId: companyId!,
          fileName: file.originalname || 'document',
          content,
          fileType: file.mimetype,
          filePath: file.path,
        },
      });

      // Invalidate so AI picks up new doc on the very next chat
      invalidateVectorStore(companyId);

      res.json({ message: 'Document uploaded successfully', document: doc });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async getAllDocuments(req: any, res: any) {
    try {
      const companyId = req.companyId;
      const { page = 1, limit = 10 } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const documents = await prisma.kBDocument.findMany({
        where: { companyId },
        select: {
          id: true,
          fileName: true,
          fileType: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      });

      const total = await prisma.kBDocument.count({ where: { companyId } });

      res.json({
        message: 'Documents retrieved successfully',
        data: documents,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async getDocumentById(req: any, res: any) {
    try {
      const { documentId } = req.params;
      const companyId = req.companyId;

      const doc = await prisma.kBDocument.findUnique({ where: { id: documentId } });

      if (!doc || doc.companyId !== companyId) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json({ message: 'Document retrieved successfully', document: doc });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async deleteDocument(req: any, res: any) {
    try {
      const { documentId } = req.params;
      const companyId = req.companyId;

      const doc = await prisma.kBDocument.findUnique({ where: { id: documentId } });

      if (!doc || doc.companyId !== companyId) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Delete physical file if it exists
      if (doc.filePath && fs.existsSync(doc.filePath)) {
        fs.unlinkSync(doc.filePath);
      }

      await prisma.kBDocument.delete({ where: { id: documentId } });

      // Invalidate vector store so AI uses fresh data on next chat
      invalidateVectorStore(companyId);

      res.json({ message: 'Document deleted successfully' });
    } catch (err: any) {
      console.error('DELETE /documents error:', err);
      res.status(500).json({ message: 'Failed to delete document', error: err.message });
    }
  }

  // ──────────────────────────────────────────────
  // Inquiries
  // ──────────────────────────────────────────────

  /**
   * PATCH /api/companies/inquiries/:id/resolve
   * Manually resolve an inquiry as a human executive.
   */
  async resolveInquiry(req: any, res: any) {
    try {
      const inquiry = await prisma.inquiry.findFirst({
        where: { id: req.params.id, companyId: req.companyId },
      });

      if (!inquiry) {
        return res.status(404).json({ message: 'Inquiry not found' });
      }

      const updatedInquiry = await prisma.inquiry.update({
        where: { id: req.params.id },
        data: { status: 'resolved_human' },
      });

      await prisma.message.create({
        data: {
          inquiryId: req.params.id,
          sender: 'human',
          content: '[Ticket resolved manually by Executive]',
        },
      });

      res.json({ message: 'Inquiry resolved', inquiry: updatedInquiry });
    } catch (err: any) {
      console.error('Resolve Inquiry Error:', err);
      res.status(500).json({ message: 'Failed to resolve inquiry', error: err.message });
    }
  }

  /**
   * PATCH /api/companies/inquiries/:id/assign
   * Assign a ticket to a human executive.
   */
  async assignInquiry(req: any, res: any) {
    try {
      const { executiveName } = req.body;

      const inquiry = await prisma.inquiry.findFirst({
        where: { id: req.params.id, companyId: req.companyId },
      });

      if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

      const updated = await prisma.inquiry.update({
        where: { id: req.params.id },
        data: {
          assignedTo: executiveName || 'Support Executive',
          status: 'escalated',
        },
      });

      res.json({ message: 'Inquiry assigned', inquiry: updated });
    } catch (err: any) {
      console.error('Assign Ticket Error:', err);
      res.status(500).json({ message: 'Failed to assign ticket', error: err.message });
    }
  }

  // ──────────────────────────────────────────────
  // Public
  // ──────────────────────────────────────────────

  /** GET /api/companies/:companyId — public company details */
  async getCompanyDetails(req: any, res: any) {
    try {
      const { companyId } = req.params;
      console.log(`[DEBUG] GET /api/companies/${companyId} hit`);

      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          companyName: true,
          category: true,
          supportEmail: true,
          domain: true,
          createdAt: true,
        },
      });

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      res.json({ message: 'Company details retrieved', company });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}

export default new CompanyController();
