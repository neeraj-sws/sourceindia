const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const buyerRequirementsController = require('../controllers/buyerRequirementsController');

// Buyer: Create requirement (public - no auth required)
router.post('/create', buyerRequirementsController.createRequirement);

// Buyer: Search cities for city dropdown (public)
router.get('/cities/search', buyerRequirementsController.searchCities);

// Buyer: Get my requirements (auth required)
router.get('/my', authenticateToken, buyerRequirementsController.getMyRequirements);

// Buyer: Get requirement by ID
router.get('/:id', buyerRequirementsController.getRequirementById);

// Buyer: Get requirement activity log
router.get('/:id/activity-log', buyerRequirementsController.getRequirementActivityLog);

// Seller: Get buy leads
router.get('/seller/leads', authenticateToken, buyerRequirementsController.getSellerBuyLeads);

// Seller: Get lead counts
router.get('/seller/lead-counts', authenticateToken, buyerRequirementsController.getSellerLeadCounts);

// Seller: Get single lead detail
router.get('/seller/lead/:id', authenticateToken, buyerRequirementsController.getBuyLeadDetail);

// Seller: Respond/Accept/Reject lead
router.post('/seller/lead/:id/respond', authenticateToken, buyerRequirementsController.sellerRespondToLead);

// Seller: Mark accepted lead as completed
router.post('/seller/lead/:id/complete', authenticateToken, buyerRequirementsController.sellerCompleteLead);

// Seller: Get performance
router.get('/seller/performance', authenticateToken, buyerRequirementsController.getSellerPerformance);

module.exports = router;
