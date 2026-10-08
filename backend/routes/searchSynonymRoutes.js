const express = require('express');
const router = express.Router();
const controller = require('../controllers/searchSynonymController');

// Search synonyms (Keyword Master > Search Synonyms)
router.get('/server-side', controller.getSynonymsServerSide);
router.get('/preview', controller.previewQuery);
router.post('/', controller.createSynonym);
router.put('/:id', controller.updateSynonym);
router.patch('/:id/status', controller.updateSynonymStatus);
router.delete('/:id', controller.deleteSynonym);

// Search logs (Keyword Master > Search Logs)
router.get('/logs/server-side', controller.getSearchLogsServerSide);

module.exports = router;
