const express = require('express');
const router = express.Router();
const inventoriesController = require('../controllers/inventoriesController');

router.get('/', inventoriesController.getAllInventories);
router.get('/server-side', inventoriesController.getAllInventoriesServerSide);
router.get('/count', inventoriesController.getInventoriesCount);
router.delete('/delete-selected', inventoriesController.deleteSelectedInventories);
router.delete('/:id', inventoriesController.deleteInventories);

module.exports = router;
