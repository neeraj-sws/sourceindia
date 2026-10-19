const { Op, fn, col, literal, QueryTypes } = require('sequelize');
const moment = require('moment-timezone');
const sequelize = require('../config/database');
const SearchSynonym = require('../models/SearchSynonym');
const SearchLog = require('../models/SearchLog');
const Users = require('../models/Users');
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
// Day and month boundaries in India time, so "Today" starts at midnight IST, not the server's midnight.
const dateWhere = (range) => {
  const now = moment.tz('Asia/Kolkata');
  switch (range) {
    case 'today': return { [Op.gte]: now.clone().startOf('day').toDate() };
    case 'last7days': return { [Op.gte]: now.clone().subtract(6, 'days').startOf('day').toDate() };
    case 'last30days': return { [Op.gte]: now.clone().subtract(29, 'days').startOf('day').toDate() };
    case 'thismonth': return { [Op.gte]: now.clone().startOf('month').toDate(), [Op.lte]: now.toDate() };
    default: return null;
  }
};

// One row per search text: how often, when last, and how many results it found last time.
exports.getSearchLogsServerSide = async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '', sortBy = 'searches', sort = 'DESC', zero_only, dateRange, user_id, logged_in_only } = req.query;

    if (user_id !== undefined && (!/^\d+$/.test(String(user_id)) || Number(user_id) < 1)) {
      return res.status(400).json({ error: 'user_id must be a positive integer' });
    }
    if (logged_in_only !== undefined && !['true', 'false'].includes(String(logged_in_only).toLowerCase())) {
      return res.status(400).json({ error: 'logged_in_only must be true or false' });
    }

    const limitValue = parseInt(limit, 10) || 25;
    const offset = (parseInt(page, 10) - 1) * limitValue;
    const replacements = {};

    const where = {};
    if (search) where.normalized_query = { [Op.like]: `%${normalize(search)}%` };
    const created = dateWhere(dateRange);
    if (created) where.created_at = created;

    const entryConditions = [];
    if (user_id !== undefined) {
      entryConditions.push('user_id = :userId');
      replacements.userId = Number(user_id);
    }
    if (String(logged_in_only).toLowerCase() === 'true') entryConditions.push('user_id IS NOT NULL');
    if (entryConditions.length) {
      where.id = {
        [Op.in]: literal(`(SELECT search_log_id FROM search_log_entries WHERE ${entryConditions.join(' AND ')})`),
      };
    }

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
        [fn('MAX', col('search_log_id')), 'log_id'],
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

    const allGroups = await SearchLog.findAll({ ...groupQuery, attributes: ['normalized_query'], replacements });
    const rows = await SearchLog.findAll({ ...groupQuery, order, limit: limitValue, offset, replacements });
    const summaryWhere = { ...(created ? { created_at: created } : {}) };
    if (entryConditions.length) summaryWhere.id = where.id;
    const [summary] = await SearchLog.findAll({
      where: summaryWhere,
      attributes: [
        [fn('COUNT', col('search_log_id')), 'total_searches'],
        [fn('SUM', literal('result_count = 0')), 'zero_result_searches'],
        [fn('COUNT', fn('DISTINCT', col('normalized_query'))), 'distinct_queries'],
      ],
      raw: true,
      replacements,
    });

    // Per-keyword user info for the current page: the latest logged-in user across ALL
    // occurrences of the search text, how many distinct users searched it, and the total
    // entry count (so the UI can tell "only guests" from "no data"). Decorative only:
    // pagination counts and every existing field stay exactly as computed above.
    const pageQueries = rows.map((row) => row.normalized_query).filter(Boolean);
    const userNamesByQuery = {};
    const usersCountByQuery = {};
    const entriesCountByQuery = {};
    if (pageQueries.length) {
      const latestUserRows = await sequelize.query(
        `SELECT l.normalized_query AS normalized_query,
                e.user_id AS user_id, u.fname AS fname, u.lname AS lname, u.email AS email
           FROM search_log_entries e
           JOIN search_logs l ON l.search_log_id = e.search_log_id
           LEFT JOIN users u ON u.user_id = e.user_id
           JOIN (
             SELECT l2.normalized_query AS nq, MAX(e2.id) AS max_entry_id
               FROM search_log_entries e2
               JOIN search_logs l2 ON l2.search_log_id = e2.search_log_id
              WHERE e2.user_id IS NOT NULL AND l2.normalized_query IN (:queries)
              GROUP BY l2.normalized_query
           ) latest ON latest.max_entry_id = e.id`,
        { replacements: { queries: pageQueries }, type: QueryTypes.SELECT }
      );
      const entryCountRows = await sequelize.query(
        `SELECT l.normalized_query AS normalized_query,
                COUNT(DISTINCT e.user_id) AS users_count,
                COUNT(*) AS entries_count
           FROM search_log_entries e
           JOIN search_logs l ON l.search_log_id = e.search_log_id
          WHERE l.normalized_query IN (:queries)
          GROUP BY l.normalized_query`,
        { replacements: { queries: pageQueries }, type: QueryTypes.SELECT }
      );
      for (const countRow of entryCountRows) {
        usersCountByQuery[countRow.normalized_query] = Number(countRow.users_count || 0);
        entriesCountByQuery[countRow.normalized_query] = Number(countRow.entries_count || 0);
      }
      for (const latestRow of latestUserRows) {
        const name = [latestRow.fname, latestRow.lname].filter(Boolean).join(' ').trim();
        userNamesByQuery[latestRow.normalized_query] = (name && latestRow.email)
          ? `${name} (${latestRow.email})`
          : (name || latestRow.email || null);
      }
    }

    res.json({
      data: rows.map((row, index) => ({
        ...row,
        id: offset + index + 1,
        user_names: userNamesByQuery[row.normalized_query] || null,
        users_count: usersCountByQuery[row.normalized_query] || 0,
        entries_count: entriesCountByQuery[row.normalized_query] || 0,
      })),
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

// Paginated rows for an aggregate search log. This endpoint is mounted behind admin auth.
exports.getSearchLogEntries = async (req, res) => {
  try {
    const searchLogId = String(req.params.id || '');
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 25 : Number(req.query.limit);
    if (!/^\d+$/.test(searchLogId) || Number(searchLogId) < 1) {
      return res.status(400).json({ error: 'id must be a positive integer' });
    }
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'page and limit must be positive integers; limit cannot exceed 100' });
    }

    // One keyword can span many aggregate rows (one per occurrence). Resolve the search
    // text behind the given log id and return entries for every occurrence of it, so a
    // deduplicated repeat (aggregate row without an entry) can never empty the modal.
    const logRow = await SearchLog.findOne({
      attributes: ['normalized_query'],
      where: { search_log_id: Number(searchLogId) },
      raw: true,
    });
    if (!logRow) return res.json({ data: [], totalRecords: 0, filteredRecords: 0 });

    const replacements = { normalizedQuery: logRow.normalized_query, limit, offset: (page - 1) * limit };
    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) AS totalRecords
         FROM search_log_entries e
         JOIN search_logs l ON l.search_log_id = e.search_log_id
        WHERE l.normalized_query = :normalizedQuery`,
      { replacements, type: QueryTypes.SELECT }
    );
    const data = await sequelize.query(
      `SELECT e.user_id,
        CASE WHEN e.user_id IS NULL THEN 'Guest'
          ELSE COALESCE(NULLIF(CONCAT_WS(' ', u.fname, u.lname), ''), 'Guest') END AS user_name,
        CASE WHEN e.user_id IS NULL THEN 'Guest' ELSE COALESCE(u.email, 'Guest') END AS email,
        e.searched_at
       FROM search_log_entries e
       JOIN search_logs l ON l.search_log_id = e.search_log_id
       LEFT JOIN users u ON u.user_id = e.user_id
       WHERE l.normalized_query = :normalizedQuery
       ORDER BY e.searched_at DESC, e.id DESC
       LIMIT :limit OFFSET :offset`,
      { replacements, type: QueryTypes.SELECT }
    );
    const totalRecords = Number(countResult?.totalRecords || 0);
    res.json({ data, totalRecords, filteredRecords: totalRecords });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Minimal user list for the Search Logs user filter.
exports.getSearchLogUsers = async (req, res) => {
  try {
    const users = await Users.findAll({
      attributes: ['id', 'fname', 'lname', 'email'],
      order: [['id', 'ASC']],
      raw: true,
    });
    res.json({ data: users.map((user) => ({
      id: user.id,
      name: [user.fname, user.lname].filter(Boolean).join(' ') || user.email,
      email: user.email,
    })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
