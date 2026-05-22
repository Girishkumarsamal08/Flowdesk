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
import { addToKnowledgeBase } from './chat.js';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretflowdeskkey';
const upload = multer({ dest: 'uploads/' });

// @route   POST /api/companies/register
// @desc    Register a new company
router.post('/register', upload.single('policyFile'), async (req, res) => {
  try {
    console.log('Registering company:', req.body.email);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('File:', req.file ? req.file.originalname : 'No file');

    const {
      email,
      password,
      companyName,
      category,
      domain,
      refundPolicy,
      companyPolicy,
      infoUrl,
    } = req.body;

    if (!email || !password || !companyName) {
      return res.status(400).json({ message: 'Missing required fields: email, password, and companyName are mandatory' });
    }

    let parsedPolicy = '';

    if (req.file) {
      const filePath = req.file.path;
      if (req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        parsedPolicy = pdfData.text;
      } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || req.file.originalname.toLowerCase().endsWith('.docx')) {
        const result = await mammoth.extractRawText({ path: filePath });
        parsedPolicy = result.value;
      }
      fs.unlinkSync(filePath);
    }

    const finalRefundPolicy = category === 'Ecommerce' ? (parsedPolicy || refundPolicy) : null;
    const finalCompanyPolicy = category === 'SaaS' ? (parsedPolicy || companyPolicy) : null;

    // 1. Check if email exists
    const existingEmail = await prisma.company.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return res.status(400).json({ message: 'Company with this email already exists' });
    }

    // 2. Check if domain is already registered (excluding public providers)
    const emailDomain = email.split('@')[1].toLowerCase();
    const publicDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'proton.me'];
    
    if (!publicDomains.includes(emailDomain)) {
      const existingDomain = await prisma.company.findFirst({
        where: { 
          OR: [
            { email: { endsWith: `@${emailDomain}` } },
            { domain: emailDomain }
          ]
        }
      });

      if (existingDomain) {
        return res.status(400).json({ 
          message: "the company is already registered pls ask the administrator of the company to access" 
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create company
    const company = await prisma.company.create({
      data: {
        email,
        passwordHash,
        companyName,
        category,
        domain: domain || emailDomain,
        refundPolicy: finalRefundPolicy,
        companyPolicy: finalCompanyPolicy,
        infoUrl,
      },
    });

    // 4. Populate Knowledge Base if policy was provided (Non-blocking)
    if (parsedPolicy) {
      addToKnowledgeBase(company.id, parsedPolicy);
    } else if (category === 'Ecommerce' && refundPolicy) {
      addToKnowledgeBase(company.id, refundPolicy);
    } else if (category === 'SaaS' && companyPolicy) {
      addToKnowledgeBase(company.id, companyPolicy);
    }

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
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   POST /api/companies/login
// @desc    Login company
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const company = await prisma.company.findUnique({
      where: { email },
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
    console.error("Registration Error:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/companies/me
// @desc    Get current company profile
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const company = await prisma.company.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        companyName: true,
        category: true,
        refundPolicy: true,
        companyPolicy: true,
        infoUrl: true,
        inquiries: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json(company);
  } catch (err: any) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// @route   PATCH /api/companies/inquiries/:id/resolve
// @desc    Resolve an inquiry manually
router.patch('/inquiries/:id/resolve', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const inquiry = await prisma.inquiry.update({
      where: { id: req.params.id },
      data: { status: 'resolved_human' }
    });

    res.json(inquiry);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to resolve inquiry' });
  }
});

export default router;
