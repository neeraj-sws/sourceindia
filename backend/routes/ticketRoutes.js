const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authenticateToken = require('../middleware/authenticateToken');

router.post('/', ticketController.createTickets);
router.post('/send-otp', ticketController.sendOtp);
router.post('/verify-otp', ticketController.verifyOtp);
router.post('/store-ticket', ticketController.createstoreTicket);
router.post('/track-ticket', ticketController.trackTicket);
router.get('/support-ticket/track/:number', ticketController.getTicketByNumber);
router.post('/store-support-ticket-reply', ticketController.ticketReplystore);
router.get('/count', ticketController.getTicketsCount);
router.get('/', ticketController.getAllTickets);
router.get('/server-side', authenticateToken, ticketController.getAllTicketsServerSide);
router.get("/:ticket_id/next", ticketController.getNextTicket);
router.get("/id/:id/next", authenticateToken, ticketController.getNextTicketById);
router.get('/:id', ticketController.getTicketsById);
router.put('/:id', ticketController.updateTickets);
router.delete('/:id', ticketController.deleteTickets);
router.patch('/:id/status', ticketController.updateTicketsStatus);

module.exports = router;
