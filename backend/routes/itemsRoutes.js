const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController');

router.post('/', itemsController.createItems);
router.get('/', itemsController.getAllItems);
router.get('/server-side', itemsController.getAllItemsServerSide);
router.get('/product-bar-graph', itemsController.getItemBarGraph);
router.get('/count', itemsController.getAllCatalogCounts);
router.delete('/delete-selected', itemsController.deleteSelectedItems);
router.get(
  '/by-category-subcategory-itemcategory-itemsubcategory/:category_id/:subcategory_id/:item_category_id/:item_sub_category_id',
  itemsController.getItemSubCategoriesByCategorySubCategoryItemCategoryItemSubCategory
);
router.post(
  '/by-selected-category-subcategory-itemcategory-itemsubcategory',
  itemsController.getItemsBySelectedCategorySubCategoryItemCategoryItemSubCategory
);
router.get('/:id', itemsController.getItemsById);
router.put('/:id', itemsController.updateItems);
router.delete('/:id', itemsController.deleteItems);
router.patch('/:id/status', itemsController.updateItemsStatus);

module.exports = router;
