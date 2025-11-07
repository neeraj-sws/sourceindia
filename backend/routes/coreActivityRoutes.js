const express = require('express');
const router = express.Router();
const coreActivityController = require('../controllers/coreActivityController');

router.post('/', coreActivityController.createCoreActivity);
router.get('/count', coreActivityController.getCoreActivityCount);
router.get('/', coreActivityController.getAllCoreActivities);
router.get('/server-side', coreActivityController.getAllCoreActivitiesServerSide);
router.delete('/delete-selected', coreActivityController.deleteSelectedCoreActivity);
router.get('/colors', coreActivityController.getAllColors);
router.get('/:id', coreActivityController.getCoreActivityById);
router.put('/:id', coreActivityController.updateCoreActivity);
router.delete('/:id', coreActivityController.deleteCoreActivity);
router.patch('/:id/status', coreActivityController.updateCoreActivityStatus);
router.patch('/:id/delete_status', coreActivityController.updateCoreActivityDeleteStatus);

module.exports = router;
