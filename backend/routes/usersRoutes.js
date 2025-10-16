const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

router.post('/send-otp', usersController.sendOtp);
router.post('/verify-otp', usersController.verifyOtp);
router.post('/register', usersController.register);
router.get('/countries', usersController.getCountries);
router.get('/states', usersController.getStates);
router.get('/cities', usersController.getCities);

module.exports = router;
