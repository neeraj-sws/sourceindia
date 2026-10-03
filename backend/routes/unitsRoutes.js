const express = require('express');
const router = express.Router();
const unitsController = require('../controllers/unitsController');

// No auth guard here, matching the other admin master routers in this project
// (faqCategoryRoutes.js, categoriesRoutes.js). Admin pages still send
// `Authorization: Bearer <token>`, it is simply not verified on this router.
router.get('/server-side', unitsController.getAllUnitsServerSide);
router.get('/', unitsController.getAllUnits);
router.post('/', unitsController.createUnit);
router.get('/:id', unitsController.getUnitById);
router.put('/:id', unitsController.updateUnit);
router.patch('/:id/status', unitsController.updateUnitStatus);
router.delete('/:id', unitsController.deleteUnit);

module.exports = router;