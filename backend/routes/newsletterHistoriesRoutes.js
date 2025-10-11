const express = require('express');
const router = express.Router();
const newsletterHistoriesController = require('../controllers/newsletterHistoriesController');

router.get('/count', newsletterHistoriesController.getNewsletterHistoriesCount);
router.get('/server-side', newsletterHistoriesController.getAllNewsletterHistoriesServerSide);

module.exports = router;
