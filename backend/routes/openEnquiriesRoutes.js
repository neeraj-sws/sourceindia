const express = require('express');
const router = express.Router();
const openEnquiriesController = require('../controllers/openEnquiriesController');

router.get('/', openEnquiriesController.getAllOpenEnquiries);
router.get('/count/:userId', openEnquiriesController.getOpenEnquiriesCountByUser);
router.get('/front-enquiry', openEnquiriesController.getFrontOpenEnquiries);
router.get('/user-openenquiry', openEnquiriesController.getUserOpenEnquiries);
router.get('/messages', openEnquiriesController.getMessages);
router.get('/openenquiry-entry', openEnquiriesController.getOpenenquiryEntry);
router.post('/cheak-chats', openEnquiriesController.cheakUserchats);
router.get('/server-side', openEnquiriesController.getAllOpenEnquiriesServerSide);
router.get('/count', openEnquiriesController.getOpenEnquiriesCount);
router.get('/:id', openEnquiriesController.getOpenEnquiriesById);
router.delete('/:id', openEnquiriesController.deleteOpenEnquiries);
router.patch('/:id/home_status', openEnquiriesController.updateOpenEnquiriesStatus);
router.patch('/:id/delete_status', openEnquiriesController.updateOpenEnquiriesDeleteStatus);
router.post("/send-message", openEnquiriesController.sendMessage);
module.exports = router;
