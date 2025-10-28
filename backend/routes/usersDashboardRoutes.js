const express = require('express');
const router = express.Router();
const userDashbordController = require('../controllers/userDashbordController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/buyer-interest', userDashbordController.getBuyerInterest);
router.post('/store-buyer-interest', userDashbordController.storeBuyerInterest);
router.get('/get-buyer-interest', userDashbordController.getBuyerInterestchecked);

module.exports = router;
