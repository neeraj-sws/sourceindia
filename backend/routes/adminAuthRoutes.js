const express = require('express');
const router = express.Router();
const { login, changePassword } = require('../controllers/adminAuthController');
const authenticateToken = require('../middleware/authenticateToken');

router.post('/login', login);
router.post('/change-password', authenticateToken, changePassword);

module.exports = router;