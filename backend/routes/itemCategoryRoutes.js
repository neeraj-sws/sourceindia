const express = require('express');
const router = express.Router();
const itemCategoryController = require('../controllers/itemCategoryController');

router.post('/', itemCategoryController.createItemCategory);
router.get('/count', itemCategoryController.getItemCategoryCount);
router.get('/', itemCategoryController.getAllItemCategory);
router.get('/server-side', itemCategoryController.getAllItemCategoryServerSide);
router.delete('/delete-selected', itemCategoryController.deleteSelectedItemCategory);
router.get(
  '/by-category-subcategory/:category_id/:subcategory_id',
  itemCategoryController.getItemCategoriesByCategoryAndSubCategory
);
router.post(
  '/by-selected-category-subcategory',
  itemCategoryController.getItemCategoriesBySelectedCategoryAndSubCategory
);
router.get('/:id', itemCategoryController.getItemCategoryById);
router.put('/:id', itemCategoryController.updateItemCategory);
router.delete('/:id', itemCategoryController.deleteItemCategory);
router.patch('/:id/status', itemCategoryController.updateItemCategoryStatus);

module.exports = router;
