const express = require('express');
const router = express.Router();
const openEnquiriesController = require('../controllers/openEnquiriesController');

router.get('/server-side', openEnquiriesController.getAllOpenEnquiriesServerSide);
router.patch('/:id/home_status', openEnquiriesController.updateOpenEnquiriesStatus);

module.exports = router;
