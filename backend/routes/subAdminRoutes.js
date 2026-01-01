const express = require('express');
const router = express.Router();
const subAdminController = require('../controllers/subAdminController');

router.post('/', subAdminController.createSubAdmin);
router.get('/', subAdminController.getAllSubAdmin);
router.get('/server-side', subAdminController.getAllSubAdminServerSide);
router.get('/count', subAdminController.getRolesCounts);
router.delete('/delete-selected', subAdminController.deleteSelectedSubAdmin);
router.get('/:id', subAdminController.getSubAdminById);
router.put('/:id', subAdminController.updateSubAdmin);
router.delete('/:id', subAdminController.deleteSubAdmin);
router.patch('/:id/status', subAdminController.updateSubAdminStatus);

module.exports = router;
