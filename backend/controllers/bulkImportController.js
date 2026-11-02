const crypto = require('crypto');
const { Op } = require('sequelize');
const BulkImportJob = require('../models/BulkImportJob');
const Roles = require('../models/Roles');
const {
  BULK_IMPORT_LEVELS,
  BulkImportInputError,
  parseBulkImportFile,
  validateBulkImportRows,
  countBulkImportRows,
  createBulkImportReport,
  comparisonKey,
  readBulkImportJobData,
  createBulkImportRow,
  classifyBulkImportError,
  getSqlCode,
  getErrorField,
  getFailureRow,
  assertBulkImportSchema,
  BulkImportSchemaError,
} = require('../utils/bulkImport');
const sequelize = require('../config/database');
const ProductKeyword = require('../models/ProductKeyword');

const isValidJobId = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const STALE_COMMIT_AFTER_MS = 5 * 60 * 1000;
const isJobOwnerOrSuperAdmin = async (job, user) => {
  if (Number(job.adminUserId) === Number(user.id)) return true;
  if (!user.role) return false;
  const role = await Roles.findByPk(user.role, { attributes: ['name'] });
  return /super\s*admin/i.test(role?.name || '');
};
const getStoredCommitResult = (job, counts = readBulkImportJobData(job).counts) => counts.commitResult || null;
const failedJobResponse = (job) => {
  const stored = getStoredCommitResult(job) || {};
  const reason = typeof stored.errorMessage === 'string' ? stored.errorMessage : 'The import could not be completed. Validate the file again.';
  return { code: 'JOB_FAILED', errorCode: stored.errorCode || 'UNKNOWN', message: `This import failed earlier. ${reason}`, errorRow: stored.errorRow || null };
};

const isStaleCommit = (job) => {
  const updatedAt = job.updated_at || job.updatedAt;
  const timestamp = updatedAt ? new Date(updatedAt).getTime() : NaN;
  return job.status === 'committing' && Number.isFinite(timestamp) && timestamp <= Date.now() - STALE_COMMIT_AFTER_MS;
};

const markStaleCommitFailed = async (job) => {
  const staleBefore = new Date(Date.now() - STALE_COMMIT_AFTER_MS);
  await BulkImportJob.update({ status: 'failed' }, {
    where: { id: job.id, status: 'committing', updated_at: { [Op.lt]: staleBefore } },
  });
  return BulkImportJob.findByPk(job.id);
};

const respondForJobStatus = async (job, res) => {
  if (!job) return res.status(404).json({ code: 'JOB_NOT_FOUND', message: 'Import job was not found.' });
  if (job.status === 'committed') {
    const jobData = readBulkImportJobData(job);
    return res.status(200).json(getStoredCommitResult(job, jobData.counts) || {});
  }
  if (job.status === 'failed') {
    return res.status(422).json(failedJobResponse(job));
  }
  if (job.status === 'committing') {
    if (isStaleCommit(job)) {
      const refreshed = await markStaleCommitFailed(job);
      if (refreshed?.status === 'committed') return respondForJobStatus(refreshed, res);
      if (refreshed?.status === 'failed') {
        return res.status(422).json(failedJobResponse(refreshed));
      }
    }
    return res.status(409).json({ code: 'JOB_IN_PROGRESS', message: 'Import already in progress' });
  }
  if (new Date(job.expiresAt).getTime() <= Date.now()) {
    return res.status(410).json({ code: 'JOB_EXPIRED', message: 'This import preview expired. Validate the file again.' });
  }
  if (job.status !== 'validated') {
    return res.status(409).json({ code: 'JOB_NOT_COMMITTABLE', message: 'This import is no longer available. Validate the file again.' });
  }
  return null;
};

const validate = async (req, res) => {
  try {
    const level = req.body?.level;
    if (!BULK_IMPORT_LEVELS[level]) return res.status(400).json({ message: 'Invalid level. Use item_category or item_sub_category.' });
    await assertBulkImportSchema();
    const { rows: parsedRows, warnings } = parseBulkImportFile({ file: req.file, level });
    const rows = await validateBulkImportRows(level, parsedRows);
    if (Buffer.byteLength(JSON.stringify(rows), 'utf8') > 12 * 1024 * 1024) {
      throw new BulkImportInputError('Validated row data is too large to store safely. Split the file into smaller uploads.');
    }
    const counts = countBulkImportRows(rows);
    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    const now = new Date();

    // Keep expired jobs briefly so a commit request can return 410; never remove an active commit.
    const cleanupBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    await BulkImportJob.destroy({ where: { expiresAt: { [Op.lt]: cleanupBefore }, status: { [Op.ne]: 'committing' } } });
    const alreadyImportedBefore = Boolean(await BulkImportJob.findOne({
      where: { fileHash, level, status: 'committed' },
      attributes: ['id'],
    }));
    if (alreadyImportedBefore) warnings.push('This file was committed before for the selected level.');

    const job = await BulkImportJob.create({
      adminUserId: Number(req.user.id),
      level,
      fileName: String(req.file.originalname || 'bulk-import.xlsx').slice(0, 255),
      fileHash,
      status: 'validated',
      counts,
      validatedRows: rows,
      expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
    });

    return res.status(200).json({
      jobId: job.id,
      counts,
      warnings,
      rows: rows.slice(0, 25),
      total: rows.length,
      sheetCount: new Set(rows.map((row) => row.sheet)).size,
      page: 1,
      limit: 25,
      alreadyImportedBefore,
    });
  } catch (error) {
    if (error instanceof BulkImportInputError) return res.status(error.statusCode).json({ message: error.message });
    if (error instanceof BulkImportSchemaError) return res.status(503).json({ code: 'BULK_IMPORT_SCHEMA_INVALID', message: error.message });
    console.error('Bulk import validation failed:', error);
    return res.status(500).json({ message: 'Unable to validate the file. Please check the file and try again.' });
  }
};

const ROW_FILTERS = new Set(['all', 'errors', 'skipped', 'name_conflict', 'create', 'created', 'failed']);
const ROW_LIMITS = new Set([10, 25, 50, 100]);
const isSkippedRow = (row) => ['exists', 'exists_inactive', 'duplicate_in_file', 'name_conflict'].includes(row.status);
const matchesRowFilter = (row, filter, isCommitted) => {
  if (filter === 'all') return true;
  if (filter === 'errors') return row.status === 'error';
  if (filter === 'skipped') return isCommitted
    ? String(row.commitStatus || '').startsWith('skipped_') && row.status !== 'error'
    : isSkippedRow(row);
  if (filter === 'name_conflict') return row.status === 'name_conflict';
  if (filter === 'create') return row.status === 'create';
  if (filter === 'created') return row.commitStatus === 'created';
  if (filter === 'failed') return row.commitStatus === 'failed' || (isCommitted && row.status === 'error');
  return false;
};
const matchesRowSearch = (row, search) => {
  if (!search) return true;
  const haystack = [row.sheet, row.rowNumber, row.status, row.message, row.commitStatus, row.commitMessage, ...Object.values(row.rawValues || {})]
    .map((value) => String(value ?? '').toLocaleLowerCase())
    .join(' ');
  return haystack.includes(search);
};
const getRowCounts = (rows, isCommitted) => ({
  all: rows.length,
  errors: rows.filter((row) => row.status === 'error').length,
  skipped: rows.filter((row) => matchesRowFilter(row, 'skipped', isCommitted)).length,
  name_conflict: rows.filter((row) => row.status === 'name_conflict').length,
  create: rows.filter((row) => row.status === 'create').length,
  created: rows.filter((row) => row.commitStatus === 'created').length,
  failed: rows.filter((row) => matchesRowFilter(row, 'failed', isCommitted)).length,
});

const getRows = async (req, res) => {
  try {
    if (!isValidJobId(req.params.jobId)) return res.status(400).json({ code: 'INVALID_JOB_ID', message: 'Invalid import job id.' });
    const page = Number(req.query.page ?? 1);
    const requestedLimit = Number(req.query.limit ?? 25);
    const limit = Math.min(requestedLimit, 100);
    const filter = String(req.query.filter ?? 'all');
    const search = String(req.query.search ?? '').trim().toLocaleLowerCase();
    if (!Number.isSafeInteger(page) || page < 1) return res.status(400).json({ code: 'INVALID_PAGE', message: 'Page must be a positive integer.' });
    if (!Number.isSafeInteger(requestedLimit) || !ROW_LIMITS.has(requestedLimit) || limit > 100) {
      return res.status(400).json({ code: 'INVALID_LIMIT', message: 'Limit must be 10, 25, 50 or 100.' });
    }
    if (!ROW_FILTERS.has(filter)) return res.status(400).json({ code: 'INVALID_FILTER', message: 'Invalid row filter.' });
    if (search.length > 200) return res.status(400).json({ code: 'INVALID_SEARCH', message: 'Search must be 200 characters or fewer.' });

    const job = await BulkImportJob.findByPk(req.params.jobId);
    if (!job) return res.status(404).json({ code: 'JOB_NOT_FOUND', message: 'Import job was not found.' });
    if (!(await isJobOwnerOrSuperAdmin(job, req.user))) {
      return res.status(403).json({ code: 'JOB_FORBIDDEN', message: 'You do not have access to this import job.' });
    }
    if (new Date(job.expiresAt).getTime() <= Date.now()) {
      return res.status(410).json({ code: 'JOB_EXPIRED', message: 'This import preview expired. Validate the file again.' });
    }

    const { validatedRows } = readBulkImportJobData(job);
    const isCommitted = job.status === 'committed';
    const filteredRows = validatedRows
      .filter((row) => matchesRowFilter(row, filter, isCommitted))
      .filter((row) => matchesRowSearch(row, search));
    const offset = (page - 1) * limit;
    return res.json({
      rows: filteredRows.slice(offset, offset + limit),
      total: filteredRows.length,
      page,
      limit,
      counts: getRowCounts(validatedRows, isCommitted),
    });
  } catch (error) {
    console.error('Bulk import rows request failed:', error.message, error.stack);
    return res.status(500).json({ message: 'Unable to load import rows.' });
  }
};

const getReport = async (req, res) => {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.jobId)) {
      return res.status(400).json({ message: 'Invalid import job id.' });
    }
    const job = await BulkImportJob.findByPk(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Import job was not found.' });
    if (new Date(job.expiresAt).getTime() <= Date.now()) {
      return res.status(410).json({ message: 'This import report expired. Validate the file again.' });
    }
    let isSuperAdmin = false;
    if (Number(job.adminUserId) !== Number(req.user.id) && req.user.role) {
      const role = await Roles.findByPk(req.user.role, { attributes: ['name'] });
      isSuperAdmin = /super\s*admin/i.test(role?.name || '');
    }
    if (Number(job.adminUserId) !== Number(req.user.id) && !isSuperAdmin) {
      return res.status(403).json({ message: 'You do not have access to this import report.' });
    }

    const buffer = createBulkImportReport(job);
    const fileName = `${job.level}_errors.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(buffer);
  } catch (error) {
    console.error('Bulk import report failed:', error.message, error.stack);
    return res.status(500).json({ message: 'Unable to generate the import report.' });
  }
};

const commitJob = async (req, res) => {
  if (!isValidJobId(req.params.jobId)) return res.status(400).json({ message: 'Invalid import job id.' });
  let job = await BulkImportJob.findByPk(req.params.jobId);
  if (!job) return res.status(404).json({ code: 'JOB_NOT_FOUND', message: 'Import job was not found.' });
  if (!(await isJobOwnerOrSuperAdmin(job, req.user))) return res.status(403).json({ code: 'JOB_FORBIDDEN', message: 'You do not have access to this import job.' });
  const existingStatusResponse = await respondForJobStatus(job, res);
  if (existingStatusResponse) return existingStatusResponse;
  try {
    await assertBulkImportSchema();
  } catch (error) {
    if (error instanceof BulkImportSchemaError) {
      return res.status(503).json({ code: 'BULK_IMPORT_SCHEMA_INVALID', message: error.message });
    }
    throw error;
  }
  let jobData;

  const [claimed] = await BulkImportJob.update({ status: 'committing' }, {
    where: { id: job.id, status: 'validated', expiresAt: { [Op.gt]: new Date() } },
  });
  if (!claimed) {
    job = await BulkImportJob.findByPk(job.id);
    return (await respondForJobStatus(job, res)) || res.status(409).json({ code: 'JOB_NOT_COMMITTABLE', message: 'This import is no longer available. Validate the file again.' });
  }

  const committedAt = new Date();
  let transaction;
  let writesStarted = false;
  let failingRow = null;
  try {
    jobData = readBulkImportJobData(job);
    if (job.level === 'item_category') {
      const keywordColumns = await sequelize.getQueryInterface().describeTable('product_keywords');
      if (!Object.prototype.hasOwnProperty.call(keywordColumns, 'item_category_id')) {
        throw new Error('The Item Category keyword field is not available.');
      }
    }
    transaction = await sequelize.transaction();
    const freshRows = await validateBulkImportRows(job.level, jobData.validatedRows, { transaction });
    const originalCreateKeys = new Set(jobData.validatedRows.filter((row) => row.status === 'create').map((row) => `${row.sheet}::${row.rowNumber}`));
    const results = freshRows.map((row) => ({
      ...row,
      commitStatus: row.status === 'create' ? 'pending' : `skipped_${row.status}`,
    }));
    const createRows = results.filter((row) => row.status === 'create');
    let created = 0;
    const createdKeywordNames = new Set();
    let existingKeywordNames = new Set();
    if (job.level === 'item_sub_category' && createRows.length) {
      const keywords = await ProductKeyword.findAll({ attributes: ['name'], raw: true, transaction });
      existingKeywordNames = new Set(keywords.map((keyword) => comparisonKey(keyword.name)));
    }
    for (const row of createRows) {
      failingRow = row;
      const { keywordSkipped } = await createBulkImportRow(job.level, row, {
        transaction,
        existingKeywordNames,
        createdKeywordNames,
        onWrite: () => { writesStarted = true; },
      });
      row.commitStatus = 'created';
      row.commitMessage = keywordSkipped
        ? 'Created Item Sub Category; matching Product Keyword already exists globally and was left unchanged.'
        : 'Created successfully.';
      created += 1;
    }
    failingRow = null;
    const skippedExists = results.filter((row) => ['exists', 'exists_inactive'].includes(row.status)).length;
    const skippedNameConflict = results.filter((row) => row.status === 'name_conflict').length;
    const failed = results.filter((row) => originalCreateKeys.has(`${row.sheet}::${row.rowNumber}`) && row.status === 'error').length;
    const commitCounts = { created, skippedExists, skippedNameConflict, failed };
    const storedCounts = { ...jobData.counts, commitResult: { ...commitCounts, committedAt: committedAt.toISOString() } };
    await BulkImportJob.update({ status: 'committed', counts: storedCounts, validatedRows: results }, { where: { id: job.id }, transaction });
    await transaction.commit();
    return res.json({ ...commitCounts, committedAt });
  } catch (error) {
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Bulk import transaction rollback failed:', rollbackError.message, rollbackError.stack);
        writesStarted = true;
      }
    }
    const failure = classifyBulkImportError(error);
    const errorRow = getFailureRow(failingRow);
    const safeMessage = failure.message;
    let updateValues = { status: 'validated' };
    if (writesStarted && jobData) {
      const failedCounts = {
        created: 0,
        skippedExists: 0,
        skippedNameConflict: 0,
        failed: Number(jobData.counts.create || 0),
        errorCode: failure.errorCode,
        errorMessage: safeMessage,
        errorRow,
      };
      updateValues = {
        status: 'failed',
        counts: { ...jobData.counts, commitResult: failedCounts },
        validatedRows: jobData.validatedRows.map((row) => ({
          ...row,
          commitStatus: row.status === 'create' ? 'failed' : `skipped_${row.status}`,
          commitMessage: row.status === 'create'
            ? (failingRow && row.sheet === failingRow.sheet && row.rowNumber === failingRow.rowNumber ? safeMessage : 'Not imported because another row failed.')
            : row.message,
        })),
      };
    }
    let recoveredJob = null;
    try {
      await BulkImportJob.update(updateValues, { where: { id: job.id, status: 'committing' } });
      recoveredJob = await BulkImportJob.findByPk(job.id);
    } catch (stateError) {
      console.error('Bulk import commit state recovery failed:', stateError.message, stateError.stack);
    }
    console.error('Bulk import commit failed:', {
      jobId: job.id,
      level: job.level,
      adminUserId: job.adminUserId,
      row: errorRow,
      errorName: error.name,
      sqlCode: getSqlCode(error),
      failingField: getErrorField(error),
      errorMessage: error.message,
      stack: error.stack,
    });
    if (writesStarted && recoveredJob?.status === 'failed') {
      return res.status(422).json({
        code: 'JOB_FAILED',
        errorCode: failure.errorCode,
        message: safeMessage,
        errorRow,
      });
    }
    if (writesStarted) return res.status(500).json({ code: 'COMMIT_STATE_RECOVERY', message: 'The import could not be confirmed as failed. Check the job status before retrying.' });
    return res.status(500).json({ code: 'COMMIT_RETRYABLE', message: 'The import could not be completed before any records were written. You can retry.' });
  }
};

const commit = async (req, res) => {
  try {
    return await commitJob(req, res);
  } catch (error) {
    console.error('Bulk import commit request failed:', error);
    return res.status(500).json({ message: 'Unable to process this import. Please try again.' });
  }
};

module.exports = { validate, getRows, getReport, commit };
