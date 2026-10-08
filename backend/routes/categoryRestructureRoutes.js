const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoryRestructureController');

router.get('/options', controller.getOptions);
router.post('/preview', controller.preview);
router.post('/apply', controller.apply);
router.get('/logs/server-side', controller.getLogsServerSide);
router.get('/logs/admins', controller.getLogAdmins);

module.exports = router;
