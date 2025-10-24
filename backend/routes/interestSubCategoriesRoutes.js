const express = require('express');
const router = express.Router();
const interestSubCategoriesController = require('../controllers/interestSubCategoriesController');

router.post('/', interestSubCategoriesController.createInterestSubCategories);
router.get('/', interestSubCategoriesController.getAllInterestSubCategories);
router.get('/count_relation', interestSubCategoriesController.getBuyerInterestsWithProductCount);
router.get('/server-side', interestSubCategoriesController.getAllInterestSubCategoriesServerSide);
router.delete('/delete-selected', interestSubCategoriesController.deleteSelectedInterestSubCategories);
router.get('/category/:interest_category_id', interestSubCategoriesController.getInterestSubCategoriesByCategory);
router.get('/:id', interestSubCategoriesController.getInterestSubCategoriesById);
router.put('/:id', interestSubCategoriesController.updateInterestSubCategories);
router.delete('/:id', interestSubCategoriesController.deleteInterestSubCategories);
router.patch('/:id/status', interestSubCategoriesController.updateInterestSubCategoriesStatus);

module.exports = router;
