const express = require('express');
const router = express.Router();
const subAdminController = require('../controllers/subAdminController');

router.post('/', subAdminController.createSubAdmin);
router.get('/', subAdminController.getAllSubAdmin);
router.get('/server-side', subAdminController.getAllSubAdminServerSide);
router.get('/:id', subAdminController.getSubAdminById);
router.put('/:id', subAdminController.updateSubAdmin);
router.delete('/:id', subAdminController.deleteSubAdmin);
router.patch('/:id/status', subAdminController.updateSubAdminStatus);

module.exports = router;
