
const express = require('express');
const router = express.Router();
const buyerEnquiryController = require('../controllers/buyerEnquiryController');

// New admin-side Buyer Enquiry list (new function)
router.get('/admin-list', buyerEnquiryController.getAdminBuyerEnquiryList);
// Admin: Get all Buyer Enquiries with user and company info
router.get('/admin', buyerEnquiryController.getAdminBuyerEnquiries);

// Get Buyer Enquiries for a specific user
router.get('/user', buyerEnquiryController.getUserBuyerEnquiries);

module.exports = router;
