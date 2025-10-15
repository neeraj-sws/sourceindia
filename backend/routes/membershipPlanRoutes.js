const express = require('express');
const router = express.Router();
const membershipPlanController = require('../controllers/membershipPlanController');

router.post('/', membershipPlanController.createMembershipPlan);
router.get('/', membershipPlanController.getAllMembershipPlan);
router.get('/server-side', membershipPlanController.getAllMembershipPlanServerSide);
router.delete('/delete-selected', membershipPlanController.deleteSelectedMembershipPlan);
router.get('/:id', membershipPlanController.getMembershipPlanById);
router.put('/:id', membershipPlanController.updateMembershipPlan);
router.delete('/:id', membershipPlanController.deleteMembershipPlan);
router.patch('/:id/status', membershipPlanController.updateMembershipPlanStatus);
router.patch('/:id/delete_status', membershipPlanController.updateMembershipPlanDeleteStatus);

module.exports = router;
