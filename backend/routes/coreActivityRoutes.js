const express = require('express');
const router = express.Router();
const coreActivityController = require('../controllers/coreActivityController');

router.post('/', coreActivityController.createCoreActivity);
router.get('/', coreActivityController.getAllCoreActivities);
router.get('/server-side', coreActivityController.getAllCoreActivitiesServerSide);
router.get('/colors', coreActivityController.getAllColors);
router.get('/:id', coreActivityController.getCoreActivityById);
router.put('/:id', coreActivityController.updateCoreActivity);
router.delete('/:id', coreActivityController.deleteCoreActivity);
router.patch('/:id/status', coreActivityController.updateCoreActivityStatus);

module.exports = router;
