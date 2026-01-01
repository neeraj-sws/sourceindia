const express = require('express');
const router = express.Router();
const subSubCategoriesController = require('../controllers/subSubCategoriesController');

router.post('/', subSubCategoriesController.createSubSubCategories);
router.get('/', subSubCategoriesController.getAllSubSubCategories);
router.get('/server-side', subSubCategoriesController.getAllSubSubCategoriesServerSide);
router.get('/count', subSubCategoriesController.getAllInterestCounts);
router.delete('/delete-selected', subSubCategoriesController.deleteSelectedSubSubCategories);
router.get('/:id', subSubCategoriesController.getSubSubCategoriesById);
router.put('/:id', subSubCategoriesController.updateSubSubCategories);
router.delete('/:id', subSubCategoriesController.deleteSubSubCategories);
router.patch('/:id/status', subSubCategoriesController.updateSubSubCategoriesStatus);
router.patch('/:id/delete_status', subSubCategoriesController.updateSubSubCategoriesDeleteStatus);

module.exports = router;
