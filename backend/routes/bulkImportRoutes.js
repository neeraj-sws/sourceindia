const express = require('express');
const multer = require('multer');
const authenticateToken = require('../middleware/authenticateToken');
const bulkImportController = require('../controllers/bulkImportController');
const { MAX_FILE_BYTES } = require('../utils/bulkImport');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_BYTES, files: 1 } });

const handleUploadErrors = (error, req, res, next) => {
  if (!error) return next();
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File exceeds the 5 MB limit.' });
  }
  return res.status(400).json({ message: 'Unable to receive the uploaded file.' });
};

router.post('/validate', authenticateToken, upload.single('file'), handleUploadErrors, bulkImportController.validate);
router.get('/:jobId/rows', authenticateToken, bulkImportController.getRows);
router.post('/:jobId/commit', authenticateToken, bulkImportController.commit);
router.get('/:jobId/report', authenticateToken, bulkImportController.getReport);

module.exports = router;
