
const express = require('express');
const router = express.Router();
const Users = require('../models/Users');
const usersController = require('../controllers/usersController');
const authMiddleware = require('../middleware/authMiddleware');

// Admin: Get all users (id, fname, lname)
router.get('/all', async (req, res) => {
    try {
        const users = await Users.findAll({ attributes: ['id', 'fname', 'lname'] });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/server-side', usersController.getAllUsersHistoriesServerSide);
router.get('/all_users', usersController.getAllUsers);
router.get('/count', authMiddleware, usersController.getUsersCount);
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
router.post('/forgot-password', usersController.forgotPassword);
router.patch('/:id/status', usersController.updateUsersStatus);
router.get('/insert-from-company', usersController.insertFromCompany);
router.post('/verify-forgot-otp', usersController.verifyForgotOtp);
router.post('/reset-password', usersController.resetPassword);
router.post('/resend-otp', usersController.resendOtp);
module.exports = router;
