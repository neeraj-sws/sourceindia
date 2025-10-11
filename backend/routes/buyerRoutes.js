const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyerController');

router.post('/', buyerController.createBuyer);
router.get('/count', buyerController.getBuyerCount);
router.get('/', buyerController.getAllBuyer);
router.get('/server-side', buyerController.getAllBuyerServerSide);
router.delete('/delete-selected', buyerController.deleteSelectedBuyer);
router.get('/:id', buyerController.getBuyerById);
router.put('/:id', buyerController.updateBuyer);
router.delete('/:id', buyerController.deleteBuyer);
router.patch('/:id/status', buyerController.updateBuyerStatus);
router.patch('/:id/account_status', buyerController.updateAccountStatus);
router.patch('/:id/seller_status', buyerController.updateSellerStatus);
router.patch('/:id/delete_status', buyerController.updateBuyerDeleteStatus);

module.exports = router;
