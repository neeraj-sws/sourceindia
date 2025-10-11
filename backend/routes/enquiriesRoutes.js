const express = require('express');
const router = express.Router();
const enquiriesController = require('../controllers/enquiriesController');

router.get('/count', enquiriesController.getEnquiriesCount);
router.get('/', enquiriesController.getAllEnquiries);
router.get('/server-side', enquiriesController.getAllEnquiriesServerSide);
router.delete('/delete-selected', enquiriesController.deleteSelectedEnquiries);
router.get('/:enquiry_number', enquiriesController.getEnquiriesByNumber);
router.delete('/:id', enquiriesController.deleteEnquiries);
router.patch('/:id/delete_status', enquiriesController.updateEnquiriesDeleteStatus);

module.exports = router;
