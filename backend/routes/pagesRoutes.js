const express = require('express');
const router = express.Router();
const pagesController = require('../controllers/pagesController');

router.get('/:id', pagesController.getPagesById);
router.put('/:id', pagesController.updatePages);

module.exports = router;