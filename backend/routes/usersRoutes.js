const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/server-side', usersController.getAllUsersHistoriesServerSide);
router.get('/all_users', usersController.getAllUsers);
router.get('/count', usersController.getUsersCount);
router.post('/send-otp', usersController.sendOtp);
router.post('/verify-otp', usersController.verifyOtp);
router.post('/login', usersController.login);
router.post('/send-login-otp', usersController.sendLoginotp);
router.post('/verify-login-otp', usersController.verifyLoginotp);
router.post('/register', usersController.register);
router.post('/change-password', authMiddleware, usersController.changePassword);
router.post('/impersonate-login', usersController.impersonateLogin);
router.get('/profile', authMiddleware, usersController.getProfile);
router.post('/update-profile', authMiddleware, usersController.updateProfile);
router.get('/countries', usersController.getCountries);
router.get('/states', usersController.getStates);
router.get('/cities', usersController.getCities);
router.patch('/:id/status', usersController.updateUsersStatus);
router.get('/insert-from-company', usersController.insertFromCompany);

module.exports = router;
