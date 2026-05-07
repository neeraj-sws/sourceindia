const express = require('express');
const router = express.Router();
const productKeywordsController = require('../controllers/productKeywordsController');

router.post('/', productKeywordsController.createItemSubCategory);
router.get('/count', productKeywordsController.getItemSubCategoryCount);
router.get('/', productKeywordsController.getAllItemSubCategory);
router.get('/server-side', productKeywordsController.getAllItemSubCategoryServerSide);
router.get('/product-bar-graph', productKeywordsController.getItemSubCategoryBarGraph);
router.get('/sourcing-interest-bar-graph', productKeywordsController.getBuyerSourcingInterestsBarGraph);
router.delete('/delete-selected', productKeywordsController.deleteSelectedItemSubCategory);
router.get(
    '/by-category-subcategory-itemcategory/:category_id/:subcategory_id/:item_category_id',
    productKeywordsController.getItemSubCategoriesByCategorySubCategoryItemCategory
);
router.get(
    '/by-category-subcategory-itemcategory-all/:category_id/:subcategory_id/:item_category_id',
    productKeywordsController.getItemSubCategoriesByCategorySubCategoryItemCategoryAll
);
router.post(
    '/by-selected-category-subcategory-itemcategory',
    productKeywordsController.getItemSubCategoriesBySelectedCategorySubCategoryItemCategory
);
router.get('/by-subcategory/:id', productKeywordsController.getKeywordsBySubcategoryId);
router.get('/:id', productKeywordsController.getItemSubCategoryById);
router.put('/:id', productKeywordsController.updateKeyword);
router.delete('/:id', productKeywordsController.deleteItemSubCategory);
router.patch('/:id/status', productKeywordsController.updateItemSubCategoryStatus);

module.exports = router;
