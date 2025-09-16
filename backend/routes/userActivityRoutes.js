const express = require('express');
const router = express.Router();
const userActivityController = require('../controllers/userActivityController');

router.get('/count', userActivityController.getUserActivitiesCount);
router.get('/server-side', userActivityController.getAllUserActivitiesServerSide);
router.get('/user_id/:user_id', userActivityController.getUserActivitiesByUserId);

module.exports = router;
