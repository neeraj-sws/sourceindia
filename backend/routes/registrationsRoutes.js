const express = require('express');
const router = express.Router();
const registrationsController = require('../controllers/registrationsController');

router.delete('/delete-selected', registrationsController.deleteSelectedRegistrations);
router.get('/', registrationsController.getAllRegistrations);
router.get('/server-side', registrationsController.getAllRegistrationsServerSide);
router.delete('/:id', registrationsController.deleteRegistrations);
router.patch('/:id/delete_status', registrationsController.updateRegistrationsDeleteStatus);

module.exports = router;
