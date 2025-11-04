const express = require('express');
const router = express.Router();
const enquiriesController = require('../controllers/enquiriesController');
const usersController = require('../controllers/usersController');

router.get('/count', enquiriesController.getEnquiriesCount);
router.get('/lead-count', enquiriesController.getLeadsCount);
router.get('/user-count', usersController.getuserEnquiriesCount);
router.get('/', enquiriesController.getAllEnquiries);
router.get('/server-side', enquiriesController.getAllEnquiriesServerSide);
router.get('/by-user', enquiriesController.getEnquiriesByUserServerSide);
router.get('/by-enquiry', enquiriesController.getEnquiriesByEnquiryServerSide);
router.post('/prove-enquiry', enquiriesController.dashboardEnquiryProve);
router.get('/awarded', enquiriesController.getAwardedEnquiries);
router.get('/accept', enquiriesController.getAcceptEnquiries);
router.get('/shortlisted', enquiriesController.getShortlistedenquiries);
router.delete('/delete-selected', enquiriesController.deleteSelectedEnquiries);
router.get('/:enquiry_number', enquiriesController.getEnquiriesByNumber);
router.delete('/:id', enquiriesController.deleteEnquiries);
router.patch('/:id/delete_status', enquiriesController.updateEnquiriesDeleteStatus);


router.post('/verify', enquiriesController.verifyEmail);
router.post('/resend-otp', enquiriesController.resendOtp);
router.post('/submit-otp', enquiriesController.submitOtp);
router.post('/store', enquiriesController.storeEnquiry);
router.post('/submit-enquiry', enquiriesController.submitEnquiry);
router.post('/user-submit-enquiry', enquiriesController.submitEnquiryuser);


module.exports = router;
