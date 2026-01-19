const express = require('express');
const router = express.Router();
const enquiriesController = require('../controllers/enquiriesController');

// Admin: View Enquiry Details (no user_id restriction)
router.get('/open-enquiries/:enquiry_number', enquiriesController.getEnquiryDetailsForAdmin);

module.exports = router;
