const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');

router.post('/', testimonialController.createTestimonials);
router.get('/', testimonialController.getAllTestimonials);
router.get('/server-side', testimonialController.getAllTestimonialsServerSide);
router.get('/:id', testimonialController.getTestimonialsById);
router.put('/:id', testimonialController.updateTestimonials);
router.delete('/:id', testimonialController.deleteTestimonials);
router.patch('/:id/status', testimonialController.updateTestimonialsStatus);

module.exports = router;
