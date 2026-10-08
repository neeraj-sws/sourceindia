const express = require('express');
const router = express.Router();
const productKeywordCategoryController = require('../controllers/productKeywordCategoryController');

// Makes sure product_keywords has its item_category_id column before any request is served.
router.use(async (req, res, next) => {
  try {
    await productKeywordCategoryController.ensureSchema();
    next();
  } catch (err) {
    console.error('Product keyword category schema check failed:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', productKeywordCategoryController.createKeyword);
router.post('/import', productKeywordCategoryController.importKeywords);
router.get('/count', productKeywordCategoryController.getItemCategoryCount);
router.get('/', productKeywordCategoryController.getAllItemCategories);
router.get('/server-side', productKeywordCategoryController.getAllItemCategoriesServerSide);
router.delete('/delete-selected', productKeywordCategoryController.deleteSelectedKeywords);
router.get('/by-item-category/:id', productKeywordCategoryController.getKeywordsByItemCategoryId);
router.put('/:id', productKeywordCategoryController.updateKeyword);
router.delete('/:id', productKeywordCategoryController.deleteKeyword);
router.patch('/:id/status', productKeywordCategoryController.updateItemCategoryStatus);

module.exports = router;
