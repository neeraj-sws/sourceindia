const express = require('express');
const router = express.Router();
const adminBuyerRequirementsController = require('../controllers/adminBuyerRequirementsController');

// No auth guard on this router, matching sellerRoutes.js and the other
// admin routers in this project. Admin pages still send
// `Authorization: Bearer <token>`, it is simply not verified here.

// Admin: List all requirements
router.get('/requirements', adminBuyerRequirementsController.getAllRequirements);

// Admin: All assignments history
router.get('/history', adminBuyerRequirementsController.getAllAssignmentsHistory);

// Admin: Requirement counts
router.get('/requirements/counts', adminBuyerRequirementsController.getRequirementCounts);

// Admin: Requirement chart data
router.get('/requirements/chart', adminBuyerRequirementsController.getRequirementChartData);

// Admin: Requirement detail
router.get('/requirements/:id', adminBuyerRequirementsController.getRequirementDetailAdmin);

// Admin: List sellers for manual assignment
router.get('/sellers', adminBuyerRequirementsController.getSellersForAssign);

// Admin: Manually assign a seller to a requirement
router.post('/requirements/:id/assign', adminBuyerRequirementsController.adminAssignSeller);

// Admin: Change requirement status
router.put('/requirements/:id/status', adminBuyerRequirementsController.adminUpdateRequirementStatus);

// Admin: Close requirement (disabled for now)
// router.put('/requirements/:id/close', adminBuyerRequirementsController.adminCloseRequirementAction);

// Admin: Seller performance list
router.get('/seller-performance', adminBuyerRequirementsController.getSellerPerformanceAdmin);

// Admin: Seller performance detail report (charts + breakdown + monthly trends)
router.get('/seller-performance/:id/details', adminBuyerRequirementsController.getSellerPerformanceDetail);

// Admin: Update seller performance settings
router.put('/seller-performance/:id', adminBuyerRequirementsController.updateSellerPerformanceSettings);

// Admin: Get system config
router.get('/config', adminBuyerRequirementsController.getSystemConfigAdmin);

// Admin: Update system config
router.put('/config', adminBuyerRequirementsController.updateSystemConfig);

module.exports = router;