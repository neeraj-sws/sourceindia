const express = require('express');
const router = express.Router();
const sellerMailHistoriesController = require('../controllers/sellerMailHistoriesController');

router.get('/server-side', sellerMailHistoriesController.getAllSellerMailHistoriesServerSide);
router.patch('/:id/status', sellerMailHistoriesController.updateSellerMailHistoriesStatus);

module.exports = router;
