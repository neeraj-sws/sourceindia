const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

router.post('/', ticketController.createTickets);
router.post('/send-otp', ticketController.sendOtp);
router.post('/verify-otp', ticketController.verifyOtp);
router.post('/store-ticket', ticketController.createstoreTicket);
router.post('/track-ticket', ticketController.trackTicket);
router.get('/support-ticket/track/:number', ticketController.getTicketByNumber);
router.post('/store-support-ticket-reply', ticketController.ticketReplystore);
router.get('/count', ticketController.getTicketsCount);
router.get('/', ticketController.getAllTickets);
router.get('/server-side', ticketController.getAllTicketsServerSide);
router.get('/:id', ticketController.getTicketsById);
router.put('/:id', ticketController.updateTickets);
router.delete('/:id', ticketController.deleteTickets);
router.patch('/:id/status', ticketController.updateTicketsStatus);


module.exports = router;
