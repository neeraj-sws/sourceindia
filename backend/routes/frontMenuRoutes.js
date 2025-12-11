const express = require('express');
const router = express.Router();
const frontMenuController = require('../controllers/frontMenuController');

router.post('/', frontMenuController.createFrontMenu);
router.get('/', frontMenuController.getAllFrontMenu);
router.get('/server-side', frontMenuController.getAllFrontMenuServerSide);
router.get('/count', frontMenuController.getFrontMenuCount);
router.get('/:id', frontMenuController.getFrontMenuById);
router.put('/:id', frontMenuController.updateFrontMenu);
router.patch('/:id/is_show', frontMenuController.updateFrontMenuShowStatus);
router.delete('/:id', frontMenuController.deleteFrontMenu);
router.patch('/:id/status', frontMenuController.updateFrontMenuStatus);

module.exports = router;