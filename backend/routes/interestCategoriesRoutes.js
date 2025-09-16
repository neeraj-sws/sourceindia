const express = require('express');
const router = express.Router();
const interestCategoriesController = require('../controllers/interestCategoriesController');

router.post('/', interestCategoriesController.createInterestCategories);
router.get('/', interestCategoriesController.getAllInterestCategories);
router.get('/server-side', interestCategoriesController.getAllInterestCategoriesServerSide);
router.get('/:id', interestCategoriesController.getInterestCategoriesById);
router.put('/:id', interestCategoriesController.updateInterestCategories);
router.delete('/:id', interestCategoriesController.deleteInterestCategories);
router.patch('/:id/status', interestCategoriesController.updateInterestCategoriesStatus);

module.exports = router;
