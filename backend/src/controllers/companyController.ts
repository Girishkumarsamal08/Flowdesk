import multer from 'multer';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { createRequire } from 'module';
import authService from '../services/authService.js';
import { UPLOAD_DIR } from '../config/constants.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const prisma = new PrismaClient();
const upload = multer({ dest: UPLOAD_DIR });

export class CompanyController {
  async register(req: any, res: any) {
    try {
      const { email, password, companyName, category } = req.body;
      
      if (!email || !password || !companyName || !category) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const company = await authService.registerCompany(email, password, companyName, category);
      res.status(201).json({ message: 'Company registered successfully', company: { id: company.id, email: company.email } });
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
      res.json({ message: 'Login successful', token, company: { id: company.id, email: company.email, companyName: company.companyName } });
    } catch (err: any) {
      res.status(401).json({ message: err.message });
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
      } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.mimetype === 'application/msword') {
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

      res.json({ message: 'Document uploaded successfully', document: doc });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  // Get all documents for company
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

  // Get document by ID
  async getDocumentById(req: any, res: any) {
    try {
      const { documentId } = req.params;
      const companyId = req.companyId;

      const doc = await prisma.kBDocument.findUnique({
        where: { id: documentId },
      });

      if (!doc || doc.companyId !== companyId) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json({ message: 'Document retrieved successfully', document: doc });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  // Delete document
  async deleteDocument(req: any, res: any) {
    try {
      const { documentId } = req.params;
      const companyId = req.companyId;

      const doc = await prisma.kBDocument.findUnique({
        where: { id: documentId },
      });

      if (!doc || doc.companyId !== companyId) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Delete file if exists
      if (doc.filePath && fs.existsSync(doc.filePath)) {
        fs.unlinkSync(doc.filePath);
      }

      await prisma.kBDocument.delete({
        where: { id: documentId },
      });

      res.json({ message: 'Document deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  // Update company profile (name, support email, etc.)
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

  // Get company by ID (for guest/public access if needed)
  async getCompanyDetails(req: any, res: any) {
    try {
      const { companyId } = req.params;

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
