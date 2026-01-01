const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');

router.post('/', applicationController.createApplications);
router.get('/', applicationController.getAllApplications);
router.get('/server-side', applicationController.getAllApplicationsServerSide);
router.get('/count', applicationController.getApplicationsCount);
router.delete('/delete-selected', applicationController.deleteSelectedApplications);
router.delete('/count', applicationController.getApplicationsCount);
router.get('/:id', applicationController.getApplicationsById);
router.put('/:id', applicationController.updateApplications);
router.delete('/:id', applicationController.deleteApplications);
router.patch('/:id/status', applicationController.updateApplicationsStatus);
router.patch('/:id/category_status', applicationController.updateApplicationsTopCategory);
router.patch('/:id/delete_status', applicationController.updateApplicationsDeleteStatus);

module.exports = router;
