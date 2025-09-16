const express = require('express');
const router = express.Router();
const enquiriesController = require('../controllers/enquiriesController');

router.get('/count', enquiriesController.getEnquiriesCount);
router.get('/server-side', enquiriesController.getAllEnquiriesServerSide);
router.get('/:enquiry_number', enquiriesController.getEnquiriesByNumber);

module.exports = router;
