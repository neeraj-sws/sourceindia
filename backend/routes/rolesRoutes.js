const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');

router.post('/', rolesController.createRoles);
router.get('/', rolesController.getAllRoles);
router.get('/server-side', rolesController.getAllRolesServerSide);
router.delete('/delete-selected', rolesController.deleteSelectedRoles);
router.get('/:id', rolesController.getRolesById);
router.put('/:id', rolesController.updateRoles);
router.delete('/:id', rolesController.deleteRoles);
router.patch('/:id/status', rolesController.updateRolesStatus);

module.exports = router;
