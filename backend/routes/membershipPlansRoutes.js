const express = require('express');
const router = express.Router();
const membershipPlansController = require('../controllers/membershipPlansController');

router.get('/', membershipPlansController.getAllMembershipPlan);

module.exports = router;