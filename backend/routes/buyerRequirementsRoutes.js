const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');
const buyerRequirementsController = require('../controllers/buyerRequirementsController');

// Buyer: Create requirement (public - no auth required, but links to the logged-in buyer when a token is sent)
router.post('/create', optionalAuthMiddleware, buyerRequirementsController.createRequirement);

// Buyer: Search cities for city dropdown (public)
router.get('/cities/search', buyerRequirementsController.searchCities);

// Buyer: Quantity unit options for the Post Buy Requirement form (public).
// Must stay above '/:id' so "units" is not read as a requirement id.
router.get('/units', buyerRequirementsController.getUnits);

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

// Seller: Get own full performance report (same metrics as the admin detail
// page). Scoped to the logged-in seller via their token - there is deliberately
// no :id param, so a seller cannot request another seller's report.
router.get('/seller/my-performance', authMiddleware, buyerRequirementsController.getSellerMyPerformance);

// Seller: Get full lead history (auth required)
router.get('/seller/history', authMiddleware, buyerRequirementsController.getSellerHistory);

// Buyer: Get own requirement history (auth required)
router.get('/buyer/history', authMiddleware, buyerRequirementsController.getBuyerRequirementHistory);

// Buyer: Submit rating (1-5) + feedback for a completed requirement (auth required)
router.post('/:id/feedback', authMiddleware, buyerRequirementsController.submitBuyerFeedback);

module.exports = router;
