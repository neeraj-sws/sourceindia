const express = require('express');
const router = express.Router();
const inventoriesController = require('../controllers/inventoriesController');

router.get('/server-side', inventoriesController.getAllInventoriesServerSide);
router.delete('/delete-selected', inventoriesController.deleteSelectedInventories);
router.delete('/:id', inventoriesController.deleteInventories);

module.exports = router;
