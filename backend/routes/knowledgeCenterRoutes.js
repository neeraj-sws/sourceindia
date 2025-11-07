const express = require('express');
const router = express.Router();
const knowledgeCenterController = require('../controllers/knowledgeCenterController');

router.post('/', knowledgeCenterController.createKnowledgeCenter);
router.get('/count', knowledgeCenterController.getKnowledgeCenterCount);
router.get('/', knowledgeCenterController.getAllKnowledgeCenter);
router.get('/server-side', knowledgeCenterController.getAllKnowledgeCenterServerSide);
router.delete('/delete-selected', knowledgeCenterController.deleteSelectedKnowledgeCenter);
router.get('/:id', knowledgeCenterController.getKnowledgeCenterById);
router.put('/:id', knowledgeCenterController.updateKnowledgeCenter);
router.delete('/:id', knowledgeCenterController.deleteKnowledgeCenter);
router.patch('/:id/status', knowledgeCenterController.updateKnowledgeCenterStatus);
router.patch('/:id/delete_status', knowledgeCenterController.updateKnowledgeCenterDeleteStatus);

module.exports = router;
