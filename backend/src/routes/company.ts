import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const router = express.Router();
const prisma = new PrismaClient();
export const JWT_SECRET = process.env.JWT_SECRET || 'supersecretflowdeskkey';
const upload = multer({ dest: 'uploads/' });

// In-memory similarity search fallback (tenant isolated vector stores)
export class SimpleMemoryVectorStore {
  documents: { pageContent: string; metadata?: any }[] = [];

  addDocuments(docs: { pageContent: string; metadata?: any }[]) {
    this.documents.push(...docs);
  }

  similaritySearch(query: string, k: number = 3) {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length === 0) {
      return this.documents.slice(0, k);
    }

    const scoredDocs = this.documents.map(doc => {
      const contentLower = doc.pageContent.toLowerCase();
      let matches = 0;
      queryWords.forEach(word => {
        if (contentLower.includes(word)) {
          matches++;
        }
      });
      const score = matches / queryWords.length;
      return { doc, score };
    });

    scoredDocs.sort((a, b) => b.score - a.score);
    return scoredDocs.filter(s => s.score > 0).slice(0, k).map(s => s.doc);
  }
}

// Global registry of vector stores mapping companyId -> SimpleMemoryVectorStore
export const companyVectorStores: Record<string, SimpleMemoryVectorStore> = {};

// Helper to load company policies from DB into vector stores on demand
export async function ensureVectorStoreLoaded(companyId: string) {
  if (!companyVectorStores[companyId]) {
    companyVectorStores[companyId] = new SimpleMemoryVectorStore();
    
    const docs = await prisma.kBDocument.findMany({
      where: { companyId }
    });

    docs.forEach(doc => {
      const paragraphs = doc.content
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 20);

      const items = paragraphs.map(p => ({
        pageContent: p,
        metadata: { source: doc.fileName, docId: doc.id }
      }));

      companyVectorStores[companyId].addDocuments(items);
    });
    
    console.log(`Initialized vector store for company ${companyId} with ${docs.length} files.`);
  }
  return companyVectorStores[companyId];
}

// Centralized JWT Authentication Middleware
export const authenticate = (req: any, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.companyId = decoded.id;
    next();
  } catch (err: any) {
    console.error("JWT Authentication Failure:", err.message);
    return res.status(401).json({ message: 'Invalid or expired authentication token' });
  }
};

// @route   POST /api/companies/register
// @desc    Step A: Register a new company (tenant)
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      companyName,
      category,
      domain,
      supportEmail,
    } = req.body;

    if (!email || !password || !companyName || !category) {
      return res.status(400).json({ message: 'Missing required fields: email, password, companyName, and category are mandatory' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email address format' });
    }

    // 1. Check if email exists
    const existingEmail = await prisma.company.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingEmail) {
      return res.status(400).json({ message: 'Company with this email already exists' });
    }

    // 2. Check if domain is already registered
    const emailDomain = email.split('@')[1].toLowerCase();
    const publicDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'proton.me'];
    const checkDomain = (domain && domain.trim() !== '') ? domain.trim().toLowerCase() : emailDomain;

    if (!publicDomains.includes(checkDomain)) {
      const existingDomain = await prisma.company.findFirst({
        where: { 
          OR: [
            { email: { endsWith: `@${checkDomain}` } },
            { domain: checkDomain }
          ]
        }
      });

      if (existingDomain) {
        return res.status(400).json({ 
          message: "The company domain is already registered. Please ask the administrator of the company to access." 
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create company
    const company = await prisma.company.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        companyName: companyName.trim(),
        category,
        domain: checkDomain,
        supportEmail: (supportEmail && supportEmail.trim() !== '') ? supportEmail.trim() : `support@${checkDomain}`,
        apiHeaders: {},
        parsedEndpoints: [],
        dataMappings: {},
      },
    });

    // Create token
    const token = jwt.sign({ id: company.id }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      token,
      company: {
        id: company.id,
        email: company.email,
        companyName: company.companyName,
        category: company.category,
      },
    });
  } catch (err: any) {
    console.error("Registration Error:", err);
    res.status(500).json({ message: 'Internal server error during registration', error: err.message });
  }
});

// @route   POST /api/companies/login
// @desc    Login company (tenant)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const company = await prisma.company.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!company) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, company.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: company.id }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token,
      company: {
        id: company.id,
        email: company.email,
        companyName: company.companyName,
        category: company.category,
      },
    });
  } catch (err: any) {
    console.error("Login Error:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

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
    console.error("GET /me Error:", err);
    res.status(500).json({ message: 'Server error retrieving profile', error: err.message });
  }
});

// @route   PUT /api/companies/config
// @desc    Step B: Update API Stack Integration & Concept Mappings
router.put('/config', authenticate, async (req: any, res) => {
  try {
    const { apiBaseUrl, apiAuthType, apiAuthToken, apiHeaders, dataMappings } = req.body;

    const company = await prisma.company.update({
      where: { id: req.companyId },
      data: {
        apiBaseUrl,
        apiAuthType,
        apiAuthToken,
        apiHeaders: apiHeaders || {},
        dataMappings: dataMappings || {},
      }
    });

    res.json({ message: 'API Configuration updated successfully', company });
  } catch (err: any) {
    console.error("Config Error:", err);
    res.status(500).json({ message: 'Failed to update configurations', error: err.message });
  }
});

// @route   POST /api/companies/upload-kb
// @desc    Step B: Upload RAG policy documents (PDF, TXT, MD, DOCX)
router.post('/upload-kb', authenticate, upload.single('kbFile'), async (req: any, res) => {
  const filePath = req.file?.path;
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileName = req.file.originalname;
    const lowerName = fileName.toLowerCase();
    let extractedText = '';
    let fileType = 'txt';

    if (lowerName.endsWith('.pdf') || req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text || '';
      fileType = 'pdf';
    } else if (lowerName.endsWith('.docx') || req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value || '';
      fileType = 'docx';
    } else if (lowerName.endsWith('.txt') || lowerName.endsWith('.md') || req.file.mimetype.startsWith('text/')) {
      extractedText = fs.readFileSync(filePath, 'utf8');
      fileType = lowerName.endsWith('.md') ? 'md' : 'txt';
    } else {
      return res.status(400).json({ message: 'Unsupported file format. Please upload PDF, DOCX, TXT, or Markdown.' });
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ message: 'File content is empty or could not be parsed.' });
    }

    // Save to Database
    const doc = await prisma.kBDocument.create({
      data: {
        companyId: req.companyId,
        fileName,
        content: extractedText,
        fileType,
      }
    });

    // Rebuild vector store in memory for this company
    delete companyVectorStores[req.companyId];
    await ensureVectorStoreLoaded(req.companyId);

    res.status(201).json({
      message: 'Knowledge base file processed and saved successfully',
      document: {
        id: doc.id,
        fileName: doc.fileName,
        fileType: doc.fileType,
      }
    });
  } catch (err: any) {
    console.error("Upload KB Error:", err);
    res.status(500).json({ message: 'Failed to process document', error: err.message });
  } finally {
    // ALWAYS clean up the temporary file, ensuring no disk space leaks
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr: any) {
        console.error("Failed to delete temp file:", unlinkErr.message);
      }
    }
  }
});

// @route   DELETE /api/companies/kb-documents/:id
// @desc    Delete a Knowledge Base document
router.delete('/kb-documents/:id', authenticate, async (req: any, res) => {
  try {
    const doc = await prisma.kBDocument.findFirst({
      where: { id: req.params.id, companyId: req.companyId }
    });

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    await prisma.kBDocument.delete({
      where: { id: req.params.id }
    });

    // Rebuild vector store
    delete companyVectorStores[req.companyId];
    await ensureVectorStoreLoaded(req.companyId);

    res.json({ message: 'Document deleted successfully' });
  } catch (err: any) {
    console.error("Failed to delete document:", err);
    res.status(500).json({ message: 'Failed to delete document', error: err.message });
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

    // Add manual action message
    await prisma.message.create({
      data: {
        inquiryId: req.params.id,
        sender: 'human',
        content: '[Ticket resolved manually by Executive]'
      }
    });

    res.json(updatedInquiry);
  } catch (err: any) {
    console.error("Resolve Inquiry Error:", err);
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

    res.json(updated);
  } catch (err: any) {
    console.error("Assign Ticket Error:", err);
    res.status(500).json({ message: 'Failed to assign ticket', error: err.message });
  }
});

export default router;
