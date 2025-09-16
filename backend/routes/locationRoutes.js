const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/countries', locationController.getAllCountries);
router.get('/states', locationController.getAllStates);
router.get('/cities', locationController.getAllCities);
router.get('/states/:country_id', locationController.getStatesByCountry);
router.get('/cities/:state_id', locationController.getCitiesByState);

module.exports = router;
