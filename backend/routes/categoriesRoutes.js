const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');

router.post('/', categoriesController.createCategories);
router.get('/count', categoriesController.getCategoriesCount);
router.get('/', categoriesController.getAllCategories);
router.get('/category-item', categoriesController.getItemCategories);
router.get('/sub-category-item', categoriesController.getItemSubCategories);
router.get('/item-category', categoriesController.getItemCategory);
router.get('/items', categoriesController.getItem);
router.get('/server-side', categoriesController.getAllCategoriesServerSide);
router.delete('/delete-selected', categoriesController.deleteSelectedCategories);
router.get('/:id', categoriesController.getCategoriesById);
router.put('/:id', categoriesController.updateCategories);
router.delete('/:id', categoriesController.deleteCategories);
router.patch('/:id/status', categoriesController.updateCategoriesStatus);
router.patch('/:id/category_status', categoriesController.updateCategoriesTopCategory);
router.patch('/:id/delete_status', categoriesController.updateCategoriesDeleteStatus);

module.exports = router;
