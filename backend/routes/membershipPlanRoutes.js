const express = require('express');
const router = express.Router();
const membershipPlanController = require('../controllers/membershipPlanController');

router.post('/', membershipPlanController.createMembershipPlan);
router.get('/', membershipPlanController.getAllMembershipPlan);
router.get('/server-side', membershipPlanController.getAllMembershipPlanServerSide);
router.get('/:id', membershipPlanController.getMembershipPlanById);
router.put('/:id', membershipPlanController.updateMembershipPlan);
router.delete('/:id', membershipPlanController.deleteMembershipPlan);
router.patch('/:id/status', membershipPlanController.updateMembershipPlanStatus);

module.exports = router;
