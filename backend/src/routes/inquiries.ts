import express from 'express';
import { authenticate } from '../middleware/auth.js';
import inquiryController from '../controllers/inquiryController.js';

const router = express.Router();

// Get all inquiries for authenticated company
router.get('/', authenticate, (req, res) => inquiryController.getAllInquiries(req, res));

// Get inquiries by customer email
router.get('/customer', authenticate, (req, res) => inquiryController.getInquiriesByCustomer(req, res));

// Get company dashboard stats
router.get('/dashboard', authenticate, (req, res) => inquiryController.getCompanyDashboard(req, res));

// Get specific inquiry by ID
router.get('/:inquiryId', authenticate, (req, res) => inquiryController.getInquiryById(req, res));

// Update inquiry status
router.put('/:inquiryId/status', authenticate, (req, res) => inquiryController.updateInquiryStatus(req, res));

export default router;
