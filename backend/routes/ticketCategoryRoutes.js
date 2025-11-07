const express = require('express');
const router = express.Router();
const ticketCategoryController = require('../controllers/ticketCategoryController');

router.post('/', ticketCategoryController.createTicketCategory);
router.get('/count', ticketCategoryController.getTicketCategoryCount);
router.get('/', ticketCategoryController.getAllTicketCategories);
router.get('/server-side', ticketCategoryController.getAllTicketCategoriesServerSide);
router.delete('/delete-selected', ticketCategoryController.deleteSelectedTicketCategory);
router.get('/:id', ticketCategoryController.getTicketCategoryById);
router.put('/:id', ticketCategoryController.updateTicketCategory);
router.delete('/:id', ticketCategoryController.deleteTicketCategory);
router.patch('/:id/status', ticketCategoryController.updateTicketCategoryStatus);

module.exports = router;
