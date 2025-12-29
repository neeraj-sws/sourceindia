const express = require('express');
const router = express.Router();
const subCategoryController = require('../controllers/subCategoryController');

router.post('/', subCategoryController.createSubCategories);
router.get('/count', subCategoryController.getSubCategoriesCount);
router.get('/', subCategoryController.getAllSubCategories);
router.get('/server-side', subCategoryController.getAllSubCategoriesServerSide);
router.delete('/delete-selected', subCategoryController.deleteSelectedSubCategories);
router.get('/product-bar-graph', subCategoryController.getSubCategoryProductGraph);
router.get('/seller-bar-graph', subCategoryController.getSellerSubCategoryBarGraph);
router.get('/category/:category', subCategoryController.getSubCategoriesByCategory);
router.get('/:id', subCategoryController.getSubCategoriesById);
router.put('/:id', subCategoryController.updateSubCategories);
router.delete('/:id', subCategoryController.deleteSubCategories);
router.patch('/:id/status', subCategoryController.updateSubCategoriesStatus);
router.patch('/:id/delete_status', subCategoryController.updateSubCategoriesDeleteStatus);
router.post('/categories', subCategoryController.getSubCategoriesByCategories);

module.exports = router;
