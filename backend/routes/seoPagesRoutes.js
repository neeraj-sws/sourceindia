const express = require('express');
const router = express.Router();
const seoPagesController = require('../controllers/seoPagesController');

router.post('/', seoPagesController.createSeoPages);
router.get('/', seoPagesController.getAllSeoPages);
router.get('/server-side', seoPagesController.getAllSeoPagesServerSide);
router.get('/count', seoPagesController.getSeoPagesCount);
router.get('/slug/:slug', seoPagesController.getSeoPagesBySlug);
router.get('/:id', seoPagesController.getSeoPagesById);
router.put('/:id', seoPagesController.updateSeoPages);
router.delete('/:id', seoPagesController.deleteSeoPages);

module.exports = router;
