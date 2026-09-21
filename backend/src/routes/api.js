import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import * as assetController from '../controllers/assetController.js';
import * as employeeController from '../controllers/employeeController.js';
import * as custodyController from '../controllers/custodyController.js';
import * as returnController from '../controllers/returnController.js';
import * as serviceController from '../controllers/serviceController.js';
import * as licenseController from '../controllers/licenseController.js';
import * as auditController from '../controllers/auditController.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

// Auth Routes (Public & Protected)
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.getMe);

// Dashboard & Notifications
router.get('/dashboard/stats', authenticate, dashboardController.getDashboardStats);
router.get('/notifications', authenticate, dashboardController.getNotifications);

// Asset Management
router.get('/assets', authenticate, assetController.getAssets);
router.post('/assets', authenticate, assetController.createAsset);
router.get('/assets/:id', authenticate, assetController.getAssetById);
router.put('/assets/:id', authenticate, assetController.updateAsset);
router.delete('/assets/:id', authenticate, assetController.deleteAsset);
router.post('/assets/:id/transition', authenticate, assetController.transitionAssetStatus);

// Employee Management
router.get('/employees', authenticate, employeeController.getEmployees);
router.post('/employees', authenticate, employeeController.createEmployee);
router.get('/employees/:id', authenticate, employeeController.getEmployeeById);
router.put('/employees/:id', authenticate, employeeController.updateEmployee);
router.delete('/employees/:id', authenticate, employeeController.deleteEmployee);

// Custody / Assignments
router.get('/assignments', authenticate, custodyController.getCustodyRecords);
router.post('/assignments', authenticate, custodyController.createAssignment);

// Return Requests & Processing
router.get('/return-requests', authenticate, returnController.getReturnRequests);
router.post('/return-requests', authenticate, returnController.createReturnRequest);
router.put('/return-requests/:id/process', authenticate, returnController.processReturnRequest);

// Servicing / Repair Records
router.get('/service-records', authenticate, serviceController.getServiceRecords);
router.post('/service-records', authenticate, serviceController.createServiceRecord);
router.put('/service-records/:id/resolve', authenticate, serviceController.resolveServiceRecord);

// Software Licenses & Seat Allocation
router.get('/licenses', authenticate, licenseController.getSoftwareLicenses);
router.post('/licenses/:id/allocate', authenticate, licenseController.allocateLicenseSeat);
router.put('/license-allocations/:id/revoke', authenticate, licenseController.revokeLicenseSeat);

// Audit Trail
router.get('/audit-logs', authenticate, auditController.getAuditLogs);

export default router;
