const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');

router.get('/site', settingController.getSiteSettings);
router.put('/site', settingController.updateSiteSettings);
router.get('/home', settingController.getHomeSettings);
router.put('/home', settingController.updateHomeSettings);

module.exports = router;
