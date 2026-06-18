const express = require('express');
const router = express.Router();
const sellerMailHistoriesController = require('../controllers/sellerMailHistoriesController');

router.get('/', sellerMailHistoriesController.getAllSellerMailHistories);
router.get('/server-side', sellerMailHistoriesController.getAllSellerMailHistoriesServerSide);
router.get('/details/:mailCode', sellerMailHistoriesController.getSellerMailHistoryDetails);
router.get('/track-open/:token', sellerMailHistoriesController.trackSellerMailOpen);
router.post('/bulk-resend-failed/:mailCode', sellerMailHistoriesController.bulkResendFailedByMailCode);
router.post('/:id/resend', sellerMailHistoriesController.resendSellerMailHistory);
router.delete('/delete-selected', sellerMailHistoriesController.deleteSelectedSellerMailHistories);
router.delete('/:id', sellerMailHistoriesController.deleteSellerMailHistories);
router.patch('/:id/status', sellerMailHistoriesController.updateSellerMailHistoriesStatus);
router.patch('/:id/delete_status', sellerMailHistoriesController.updateSellerMailHistoriesDeleteStatus);

module.exports = router;
