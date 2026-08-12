const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoryConflictLogsController');

router.get('/server-side', controller.getAllCategoryConflictLogsServerSide);

module.exports = router;
