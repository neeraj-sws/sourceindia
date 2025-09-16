const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');

router.post('/', faqController.createFaq);
router.get('/', faqController.getAllFaqs);
router.get('/server-side', faqController.getAllFaqsServerSide);
router.get('/:id', faqController.getFaqById);
router.put('/:id', faqController.updateFaq);
router.delete('/:id', faqController.deleteFaq);
router.patch('/:id/status', faqController.updateFaqStatus);

module.exports = router;
