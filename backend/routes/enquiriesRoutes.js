const express = require('express');
const router = express.Router();
const enquiriesController = require('../controllers/enquiriesController');
const usersController = require('../controllers/usersController');

router.get('/count', enquiriesController.getEnquiriesCount);
router.get('/lead-count', enquiriesController.getLeadsCount);
router.get('/user-count', usersController.getuserEnquiriesCount);
router.get('/', enquiriesController.getAllEnquiries);
router.get('/server-side', enquiriesController.getAllEnquiriesServerSide);
router.get('/filtered', enquiriesController.getFilteredEnquiries);
router.get('/by-user', enquiriesController.getEnquiriesByUserServerSide);
router.get('/by-enquiry', enquiriesController.getEnquiriesByEnquiryServerSide);
router.post('/prove-enquiry', enquiriesController.dashboardEnquiryProve);
router.get('/awarded', enquiriesController.getAwardedEnquiries);
router.get('/accept', enquiriesController.getAcceptEnquiries);
router.get('/messages', enquiriesController.getMessageenquiries);
router.get('/all-leads', enquiriesController.getAllLeads);
router.post('/send-message', enquiriesController.postSendMessage);
router.get('/shortlisted', enquiriesController.getShortlistedenquiries);
router.get('/chart', enquiriesController.getEnquiryChartData);
router.delete('/delete-selected', enquiriesController.deleteSelectedEnquiries);
router.get('/:enquiry_number', enquiriesController.getEnquiriesByNumber);
router.get("/:enquiry_number/next", enquiriesController.getNextUnapprovedEnquiry);
router.get("/:enquiry_number/previous", enquiriesController.getPreviousUnapprovedEnquiry);
router.delete('/:id', enquiriesController.deleteEnquiries);
router.patch('/:id/delete_status', enquiriesController.updateEnquiriesDeleteStatus);
router.patch('/:id/account_status', enquiriesController.updateEnquiriesApproveStatus);

router.post('/verify', enquiriesController.verifyEmail);
router.post('/resend-otp', enquiriesController.resendOtp);
router.post('/submit-otp', enquiriesController.submitOtp);
router.post('/store', enquiriesController.storeEnquiry);
router.post('/submit-enquiry', enquiriesController.submitEnquiry);
router.post('/user-submit-enquiry', enquiriesController.submitEnquiryuser);
router.post("/send-message-connect", enquiriesController.sendMessage);

module.exports = router;
