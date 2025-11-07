const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

router.post('/', activityController.createActivity);
router.get('/count', activityController.getActivityCount);
router.get('/', activityController.getAllActivities);
router.get('/server-side', activityController.getAllActivitiesServerSide);
router.delete('/delete-selected', activityController.deleteSelectedActivity);
router.get('/coreactivity/:coreactivity', activityController.getActivityByCoreActivity);
router.get('/:id', activityController.getActivityById);
router.put('/:id', activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);
router.patch('/:id/status', activityController.updateActivityStatus);
router.patch('/:id/delete_status', activityController.updateActivityDeleteStatus);

module.exports = router;
