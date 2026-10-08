const { Op, fn, col, literal } = require('sequelize');
const moment = require('moment');
const SearchSynonym = require('../models/SearchSynonym');
const SearchLog = require('../models/SearchLog');
const { normalize, invalidateSynonyms, prepareSearchQuery } = require('../utils/searchEngine');

// Comma separated terms -> cleaned, unique, lowercase list.
const cleanTerms = (terms) => [...new Set(
  (Array.isArray(terms) ? terms : String(terms || '').split(','))
    .map((term) => normalize(term))
    .filter(Boolean)
)];

const validateTerms = (terms) => {
  const list = cleanTerms(terms);
  if (list.length < 2) return { error: 'Add at least two terms, separated by commas (e.g. smps, switch mode power supply).' };
  return { list };
};

// ---------- synonyms ----------
exports.getSynonymsServerSide = async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '', sortBy = 'id', sort = 'DESC' } = req.query;
    const limitValue = parseInt(limit, 10) || 25;
    const offset = (parseInt(page, 10) - 1) * limitValue;
    const order = [[['id', 'terms', 'status', 'updated_at'].includes(sortBy) ? sortBy : 'id', sort === 'ASC' ? 'ASC' : 'DESC']];
    const where = search ? { terms: { [Op.like]: `%${normalize(search)}%` } } : {};

    const totalRecords = await SearchSynonym.count();
    const { count: filteredRecords, rows } = await SearchSynonym.findAndCountAll({ where, order, limit: limitValue, offset });
    res.json({
      data: rows.map((row) => ({ ...row.toJSON(), term_list: cleanTerms(row.terms) })),
      totalRecords,
      filteredRecords,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.createSynonym = async (req, res) => {
  try {
    const { list, error } = validateTerms(req.body.terms);
    if (error) return res.status(400).json({ message: error });
    const status = req.body.status === undefined ? 1 : Number(req.body.status) === 0 ? 0 : 1;
    const synonym = await SearchSynonym.create({ terms: list.join(', '), status });
    invalidateSynonyms();
    res.status(201).json({ message: 'Synonym group added', synonym });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateSynonym = async (req, res) => {
  try {
    const synonym = await SearchSynonym.findByPk(req.params.id);
    if (!synonym) return res.status(404).json({ message: 'Synonym group not found' });
    const { list, error } = validateTerms(req.body.terms);
    if (error) return res.status(400).json({ message: error });
    synonym.terms = list.join(', ');
    if (req.body.status !== undefined) synonym.status = Number(req.body.status) === 0 ? 0 : 1;
    await synonym.save();
    invalidateSynonyms();
    res.json({ message: 'Synonym group updated', synonym });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateSynonymStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 0 && status !== 1) return res.status(400).json({ message: 'Invalid status. Use 1 or 0.' });
    const synonym = await SearchSynonym.findByPk(req.params.id);
    if (!synonym) return res.status(404).json({ message: 'Synonym group not found' });
    synonym.status = status;
    await synonym.save();
    invalidateSynonyms();
    res.json({ message: 'Status updated', synonym });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSynonym = async (req, res) => {
  try {
    const synonym = await SearchSynonym.findByPk(req.params.id);
    if (!synonym) return res.status(404).json({ message: 'Synonym group not found' });
    await synonym.destroy();
    invalidateSynonyms();
    res.json({ message: 'Synonym group deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// How a search text will be read: for checking a synonym right after adding it.
exports.previewQuery = async (req, res) => {
  try {
    const prepared = await prepareSearchQuery(req.query.q || '');
    res.json({
      typed: prepared.typed,
      corrected_query: prepared.corrected,
      corrections: prepared.corrections,
      variants: prepared.variants,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------- search logs ----------
const dateWhere = (range) => {
  const now = moment();
  switch (range) {
    case 'today': return { [Op.gte]: moment().startOf('day').toDate() };
    case 'last7days': return { [Op.gte]: moment().subtract(6, 'days').startOf('day').toDate() };
    case 'last30days': return { [Op.gte]: moment().subtract(29, 'days').startOf('day').toDate() };
    case 'thismonth': return { [Op.gte]: moment().startOf('month').toDate(), [Op.lte]: now.toDate() };
    default: return null;
  }
};

// One row per search text: how often, when last, and how many results it found last time.
exports.getSearchLogsServerSide = async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '', sortBy = 'searches', sort = 'DESC', zero_only, dateRange } = req.query;
    const limitValue = parseInt(limit, 10) || 25;
    const offset = (parseInt(page, 10) - 1) * limitValue;

    const where = {};
    if (search) where.normalized_query = { [Op.like]: `%${normalize(search)}%` };
    const created = dateWhere(dateRange);
    if (created) where.created_at = created;

    const having = zero_only === 'true' ? literal('MAX(result_count) = 0') : undefined;
    const sortColumns = {
      searches: literal('searches'),
      last_searched: literal('last_searched'),
      last_result_count: literal('max_result_count'),
      normalized_query: col('normalized_query'),
    };
    const order = [[sortColumns[sortBy] || literal('searches'), sort === 'ASC' ? 'ASC' : 'DESC']];

    const groupQuery = {
      where,
      attributes: [
        'normalized_query',
        [fn('MAX', col('query')), 'query'],
        [fn('COUNT', col('search_log_id')), 'searches'],
        [fn('MAX', col('created_at')), 'last_searched'],
        [fn('MAX', col('result_count')), 'max_result_count'],
        [fn('MAX', col('corrected_query')), 'corrected_query'],
      ],
      group: ['normalized_query'],
      having,
      raw: true,
    };

    const allGroups = await SearchLog.findAll({ ...groupQuery, attributes: ['normalized_query'] });
    const rows = await SearchLog.findAll({ ...groupQuery, order, limit: limitValue, offset });
    const [summary] = await SearchLog.findAll({
      where: created ? { created_at: created } : {},
      attributes: [
        [fn('COUNT', col('search_log_id')), 'total_searches'],
        [fn('SUM', literal('result_count = 0')), 'zero_result_searches'],
        [fn('COUNT', fn('DISTINCT', col('normalized_query'))), 'distinct_queries'],
      ],
      raw: true,
    });

    res.json({
      data: rows.map((row, index) => ({ ...row, id: offset + index + 1 })),
      totalRecords: allGroups.length,
      filteredRecords: allGroups.length,
      summary: {
        total_searches: Number(summary?.total_searches || 0),
        zero_result_searches: Number(summary?.zero_result_searches || 0),
        distinct_queries: Number(summary?.distinct_queries || 0),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
