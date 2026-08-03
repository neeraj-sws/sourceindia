const express = require('express');
const router = express.Router();
const openEnquiriesController = require('../controllers/openEnquiriesController');

// Admin: view an open enquiry and its associated user details.
router.get('/open-enquiries/:id', openEnquiriesController.getOpenEnquiriesById);

module.exports = router;
