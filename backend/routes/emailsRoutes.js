const express = require('express');
const router = express.Router();
const emailsController = require('../controllers/emailsController');

router.post('/', emailsController.createEmails);
router.get('/', emailsController.getAllEmails);
router.get('/server-side', emailsController.getAllEmailsServerSide);
router.get('/:id', emailsController.getEmailsById);
router.put('/:id', emailsController.updateEmails);
router.delete('/:id', emailsController.deleteEmails);

module.exports = router;
