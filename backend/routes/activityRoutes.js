const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

router.post('/', activityController.createActivity);
router.get('/', activityController.getAllActivities);
router.get('/server-side', activityController.getAllActivitiesServerSide);
router.get('/coreactivity/:coreactivity', activityController.getActivityByCoreActivity);
router.get('/:id', activityController.getActivityById);
router.put('/:id', activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);
router.patch('/:id/status', activityController.updateActivityStatus);

module.exports = router;
