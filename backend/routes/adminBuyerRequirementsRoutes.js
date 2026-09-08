const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const adminBuyerRequirementsController = require('../controllers/adminBuyerRequirementsController');

// Admin: List all requirements
router.get('/requirements', authenticateToken, adminBuyerRequirementsController.getAllRequirements);

// Admin: Requirement counts
router.get('/requirements/counts', authenticateToken, adminBuyerRequirementsController.getRequirementCounts);

// Admin: Requirement chart data
router.get('/requirements/chart', authenticateToken, adminBuyerRequirementsController.getRequirementChartData);

// Admin: Requirement detail
router.get('/requirements/:id', authenticateToken, adminBuyerRequirementsController.getRequirementDetailAdmin);

// Admin: List sellers for manual assignment
router.get('/sellers', authenticateToken, adminBuyerRequirementsController.getSellersForAssign);

// Admin: Manually assign a seller to a requirement
router.post('/requirements/:id/assign', authenticateToken, adminBuyerRequirementsController.adminAssignSeller);

// Admin: Change requirement status
router.put('/requirements/:id/status', authenticateToken, adminBuyerRequirementsController.adminUpdateRequirementStatus);

// Admin: Close requirement
router.put('/requirements/:id/close', authenticateToken, adminBuyerRequirementsController.adminCloseRequirementAction);

// Admin: Seller performance list
router.get('/seller-performance', authenticateToken, adminBuyerRequirementsController.getSellerPerformanceAdmin);

// Admin: Update seller performance settings
router.put('/seller-performance/:id', authenticateToken, adminBuyerRequirementsController.updateSellerPerformanceSettings);

// Admin: Get system config
router.get('/config', authenticateToken, adminBuyerRequirementsController.getSystemConfigAdmin);

// Admin: Update system config
router.put('/config', authenticateToken, adminBuyerRequirementsController.updateSystemConfig);

module.exports = router;
