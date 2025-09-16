const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');

router.post('/', newsletterController.createNewsletters);
router.get('/', newsletterController.getAllNewsletters);
router.get('/server-side', newsletterController.getAllNewslettersServerSide);
router.get('/user_type', newsletterController.getAllUserCategory);
router.get('/:id', newsletterController.getNewslettersById);
router.put('/:id', newsletterController.updateNewsletters);
router.delete('/:id', newsletterController.deleteNewsletters);
router.post('/:id/images', newsletterController.appendNewslettersImages);
router.delete('/:id/images/:imageId', newsletterController.removeNewslettersImage);

module.exports = router;
