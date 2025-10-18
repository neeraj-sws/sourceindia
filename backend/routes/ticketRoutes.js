const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

router.post('/', ticketController.createTickets);
router.get('/', ticketController.getAllTickets);
router.get('/server-side', ticketController.getAllTicketsServerSide);
router.get('/:id', ticketController.getTicketsById);
router.put('/:id', ticketController.updateTickets);
router.delete('/:id', ticketController.deleteTickets);
router.patch('/:id/status', ticketController.updateTicketsStatus);

router.post('/send-otp', ticketController.sendOtp);

module.exports = router;
