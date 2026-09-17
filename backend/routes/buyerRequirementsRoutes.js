const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const buyerRequirementsController = require('../controllers/buyerRequirementsController');

// Buyer: Create requirement (public - no auth required)
router.post('/create', buyerRequirementsController.createRequirement);

// Buyer: Search cities for city dropdown (public)
router.get('/cities/search', buyerRequirementsController.searchCities);

// Buyer: Get my requirements (auth required)
router.get('/my', authMiddleware, buyerRequirementsController.getMyRequirements);

// Buyer: Get requirement by ID
router.get('/:id', buyerRequirementsController.getRequirementById);

// Buyer: Get requirement activity log
router.get('/:id/activity-log', buyerRequirementsController.getRequirementActivityLog);

// Seller: Get buy leads
router.get('/seller/leads', authMiddleware, buyerRequirementsController.getSellerBuyLeads);

// Seller: Get lead counts
router.get('/seller/lead-counts', authMiddleware, buyerRequirementsController.getSellerLeadCounts);

// Seller: Get single lead detail
router.get('/seller/lead/:id', authMiddleware, buyerRequirementsController.getBuyLeadDetail);

// Seller: Respond/Accept/Reject lead
router.post('/seller/lead/:id/respond', authMiddleware, buyerRequirementsController.sellerRespondToLead);

// Seller: Mark accepted lead as completed
router.post('/seller/lead/:id/complete', authMiddleware, buyerRequirementsController.sellerCompleteLead);

// Seller: Get performance
router.get('/seller/performance', authMiddleware, buyerRequirementsController.getSellerPerformance);

module.exports = router;
