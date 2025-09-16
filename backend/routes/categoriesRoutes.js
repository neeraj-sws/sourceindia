const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');

router.post('/', categoriesController.createCategories);
router.get('/count', categoriesController.getCategoriesCount);
router.get('/', categoriesController.getAllCategories);
router.get('/server-side', categoriesController.getAllCategoriesServerSide);
router.get('/:id', categoriesController.getCategoriesById);
router.put('/:id', categoriesController.updateCategories);
router.delete('/:id', categoriesController.deleteCategories);
router.patch('/:id/status', categoriesController.updateCategoriesStatus);

module.exports = router;
