const express = require('express');
const router = express.Router();
const openEnquiriesController = require('../controllers/openEnquiriesController');

router.get('/', openEnquiriesController.getAllOpenEnquiries);
router.get('/front-enquiry', openEnquiriesController.getFrontOpenEnquiries);
router.post('/cheak-chats', openEnquiriesController.cheakUserchats);
router.get('/server-side', openEnquiriesController.getAllOpenEnquiriesServerSide);
router.get('/:id', openEnquiriesController.getOpenEnquiriesById);
router.delete('/:id', openEnquiriesController.deleteOpenEnquiries);
router.patch('/:id/home_status', openEnquiriesController.updateOpenEnquiriesStatus);
router.patch('/:id/delete_status', openEnquiriesController.updateOpenEnquiriesDeleteStatus);

module.exports = router;
