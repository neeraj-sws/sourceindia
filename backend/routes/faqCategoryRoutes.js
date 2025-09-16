const express = require('express');
const router = express.Router();
const faqCategoryController = require('../controllers/faqCategoryController');

router.post('/', faqCategoryController.createFaqCategory);
router.get('/', faqCategoryController.getAllFaqCategories);
router.get('/server-side', faqCategoryController.getAllFaqCategoriesServerSide);
router.get('/:id', faqCategoryController.getFaqCategoryById);
router.put('/:id', faqCategoryController.updateFaqCategory);
router.delete('/:id', faqCategoryController.deleteFaqCategory);
router.patch('/:id/status', faqCategoryController.updateFaqCategoryStatus);

module.exports = router;
