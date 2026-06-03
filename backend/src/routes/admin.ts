import express from 'express';
import adminController from '../controllers/adminController.js';

const router = express.Router();

// Get all companies (public admin endpoint)
// TODO: Add admin authentication middleware
router.get('/companies', (req, res) => adminController.getAllCompanies(req, res));

// Get specific company details (public)
router.get('/companies/:companyId', (req, res) => adminController.getCompanyById(req, res));

// Get company statistics
router.get('/companies/:companyId/stats', (req, res) => adminController.getCompanyStats(req, res));

// Get platform statistics (public)
router.get('/stats', (req, res) => adminController.getPlatformStats(req, res));

// Delete company (admin only)
// TODO: Add admin authentication middleware
router.delete('/companies/:companyId', (req, res) => adminController.deleteCompany(req, res));

export default router;
