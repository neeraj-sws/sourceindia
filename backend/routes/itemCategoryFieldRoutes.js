const express = require('express');
const router = express.Router();
const itemCategoryFieldController = require('../controllers/itemCategoryFieldController');

router.get('/by-item-category/:itemCategoryId', itemCategoryFieldController.getFieldsByItemCategory);
router.get('/clone-sources', itemCategoryFieldController.getCloneSources);
router.post('/clone', itemCategoryFieldController.cloneFields);
router.post('/', itemCategoryFieldController.createField);
router.put('/:id', itemCategoryFieldController.updateField);
router.delete('/:id', itemCategoryFieldController.deleteField);
router.patch('/:id/status', itemCategoryFieldController.toggleFieldStatus);
router.patch('/:id/display-order', itemCategoryFieldController.changeDisplayOrder);

module.exports = router;
