const express = require('express');
const router = express.Router();
const contactsController = require('../controllers/contactsController');

router.post('/', contactsController.contactStore);
router.delete('/delete-selected', contactsController.deleteSelectedContacts);
router.get('/', contactsController.getAllContacts);
router.get('/server-side', contactsController.getAllContactsServerSide);
router.delete('/:id', contactsController.deleteContacts);
router.patch('/:id/delete_status', contactsController.updateContactsDeleteStatus);


module.exports = router;
