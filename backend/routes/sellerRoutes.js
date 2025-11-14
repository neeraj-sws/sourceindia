const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const mailCronController = require('../controllers/mailCronController');

router.post('/', sellerController.createSeller);
router.get('/count', sellerController.getSellerCount);
router.get('/get-email-template', sellerController.getEmailtemplate);
router.post('/send-mail', sellerController.sendMail);
router.get('/sendmail-cron', mailCronController.sendMail);

router.get('/', sellerController.getAllSeller);
router.get('/server-side', sellerController.getAllSellerServerSide);
router.delete('/delete-selected', sellerController.deleteSelectedSeller);
router.get('/designations', sellerController.getAllDesignations);
router.get('/nature_business', sellerController.getAllNatureBusinesses);
router.get('/:id', sellerController.getSellerById);
router.put('/:id', sellerController.updateSeller);
router.delete('/:id', sellerController.deleteSeller);

module.exports = router;
