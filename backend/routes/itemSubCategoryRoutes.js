const express = require('express');
const router = express.Router();
const itemSubCategoryController = require('../controllers/itemSubCategoryController');

router.post('/', itemSubCategoryController.createItemSubCategory);
router.get('/count', itemSubCategoryController.getItemSubCategoryCount);
router.get('/', itemSubCategoryController.getAllItemSubCategory);
router.get('/server-side', itemSubCategoryController.getAllItemSubCategoryServerSide);
router.get('/product-bar-graph', itemSubCategoryController.getItemSubCategoryBarGraph);
router.delete('/delete-selected', itemSubCategoryController.deleteSelectedItemSubCategory);
router.get(
  '/by-category-subcategory-itemcategory/:category_id/:subcategory_id/:item_category_id',
  itemSubCategoryController.getItemSubCategoriesByCategorySubCategoryItemCategory
);
router.post(
  '/by-selected-category-subcategory-itemcategory',
  itemSubCategoryController.getItemSubCategoriesBySelectedCategorySubCategoryItemCategory
);
router.get('/:id', itemSubCategoryController.getItemSubCategoryById);
router.put('/:id', itemSubCategoryController.updateItemSubCategory);
router.delete('/:id', itemSubCategoryController.deleteItemSubCategory);
router.patch('/:id/status', itemSubCategoryController.updateItemSubCategoryStatus);

module.exports = router;
