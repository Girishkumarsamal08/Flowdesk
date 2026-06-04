import express from 'express';
import adminController from '../controllers/adminController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// All admin routes require Authorization: Admin <ADMIN_SECRET>
// Set ADMIN_SECRET in your .env before deploying.

// Get all companies
router.get('/companies', adminAuth, (req, res) => adminController.getAllCompanies(req, res));

// Get specific company details
router.get('/companies/:companyId', adminAuth, (req, res) => adminController.getCompanyById(req, res));

// Get company statistics
router.get('/companies/:companyId/stats', adminAuth, (req, res) => adminController.getCompanyStats(req, res));

// Get platform statistics
router.get('/stats', adminAuth, (req, res) => adminController.getPlatformStats(req, res));

// Delete company (permanent — all data wiped)
router.delete('/companies/:companyId', adminAuth, (req, res) => adminController.deleteCompany(req, res));

export default router;
