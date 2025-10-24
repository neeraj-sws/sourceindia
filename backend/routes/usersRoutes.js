const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/send-otp', usersController.sendOtp);
router.post('/verify-otp', usersController.verifyOtp);
router.post('/login', usersController.login);
router.post('/send-login-otp', usersController.sendLoginotp);
router.post('/verify-login-otp', usersController.verifyLoginotp);
router.post('/register', usersController.register);
router.get('/profile', authMiddleware, usersController.getProfile);
router.get('/countries', usersController.getCountries);
router.get('/states', usersController.getStates);
router.get('/cities', usersController.getCities);

module.exports = router;
