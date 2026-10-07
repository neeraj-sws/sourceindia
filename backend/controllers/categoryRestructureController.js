const { Op, QueryTypes } = require('sequelize');
const moment = require('moment');
const sequelize = require('../config/database');
const Admin = require('../models/Admin');
const CategoryRestructureLog = require('../models/CategoryRestructureLog');
const { LEVELS, LEVEL_ORDER, RestructureError, getNode, preview, apply } = require('../utils/categoryRestructure');

// Searchable dropdown source: active rows of one level, with their parent path.
const optionQueries = {
  category: `SELECT c.category_id AS id, c.name, '' AS parent_path, c.name AS path
    FROM categories c WHERE c.is_delete = 0`,
  sub_category: `SELECT sc.sub_category_id AS id, sc.name, COALESCE(c.name, '') AS parent_path,
      CONCAT_WS(' > ', c.name, sc.name) AS path
    FROM sub_categories sc LEFT JOIN categories c ON c.category_id = sc.category
    WHERE sc.is_delete = 0`,
  item_category: `SELECT ic.item_category_id AS id, ic.name, CONCAT_WS(' > ', c.name, sc.name) AS parent_path,
      CONCAT_WS(' > ', c.name, sc.name, ic.name) AS path
    FROM item_category ic
    LEFT JOIN sub_categories sc ON sc.sub_category_id = ic.subcategory_id
    LEFT JOIN categories c ON c.category_id = ic.category_id
    WHERE ic.is_delete = 0`,
  item_sub_category: `SELECT isc.item_subcategory_id AS id, isc.name, CONCAT_WS(' > ', c.name, sc.name, ic.name) AS parent_path,
      CONCAT_WS(' > ', c.name, sc.name, ic.name, isc.name) AS path
    FROM item_subcategory isc
    LEFT JOIN item_category ic ON ic.item_category_id = isc.item_category_id
    LEFT JOIN sub_categories sc ON sc.sub_category_id = isc.subcategory_id
    LEFT JOIN categories c ON c.category_id = isc.category_id
    WHERE isc.is_delete = 0`,
  item: `SELECT it.item_id AS id, it.name, CONCAT_WS(' > ', c.name, sc.name, ic.name, isc.name) AS parent_path,
      CONCAT_WS(' > ', c.name, sc.name, ic.name, isc.name, it.name) AS path
    FROM items it
    LEFT JOIN item_subcategory isc ON isc.item_subcategory_id = it.item_sub_category_id
    LEFT JOIN item_category ic ON ic.item_category_id = it.item_category_id
    LEFT JOIN sub_categories sc ON sc.sub_category_id = it.subcategory_id
    LEFT JOIN categories c ON c.category_id = it.category_id
    WHERE it.is_delete = 0`,
};

// Where to count each level's products and direct children, shown next to every option.
const countSources = {
  category: { productCol: 'category', child: { table: 'sub_categories', col: 'category' } },
  sub_category: { productCol: 'sub_category', child: { table: 'item_category', col: 'subcategory_id' } },
  item_category: { productCol: 'item_category_id', child: { table: 'item_subcategory', col: 'item_category_id' } },
  item_sub_category: { productCol: 'item_subcategory_id', child: { table: 'items', col: 'item_sub_category_id' } },
  item: { productCol: 'item_id', child: null },
};

// The joined tables use different collations, so normalise before comparing text.
const ci = (expr) => `CONVERT(${expr} USING utf8mb4) COLLATE utf8mb4_unicode_ci`;

const countByIds = async (table, col, ids) => {
  if (!ids.length) return {};
  const rows = await sequelize.query(
    `SELECT ${col} AS id, COUNT(*) AS count FROM ${table}
     WHERE ${col} IN (:ids) AND is_delete = 0 GROUP BY ${col}`,
    { replacements: { ids }, type: QueryTypes.SELECT }
  );
  return Object.fromEntries(rows.map((r) => [r.id, Number(r.count)]));
};

const handleError = (res, err) => {
  if (err instanceof RestructureError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error('categoryRestructure error:', err);
  return res.status(500).json({ error: err.message });
};

exports.getOptions = async (req, res) => {
  try {
    const { level, search = '' } = req.query;
    if (!optionQueries[level]) return res.status(400).json({ error: 'Invalid level.' });
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const term = search.toString().trim();

    // Matches on the name or anywhere in the path ("mobile", "electronics mobile"), or an exact ID.
    // Names starting with the search text are listed first.
    const words = term.split(/\s+/).filter(Boolean).slice(0, 5);
    const replacements = { limit, prefix: `${term}%`, exactId: /^\d+$/.test(term) ? Number(term) : -1 };
    let where = '';
    if (words.length) {
      where = 'WHERE (' + words.map((w, i) => {
        replacements[`w${i}`] = `%${w}%`;
        return `${ci('t.path')} LIKE :w${i}`;
      }).join(' AND ') + ') OR t.id = :exactId';
    }
    const sql = `SELECT * FROM (${optionQueries[level]}) t ${where}
      ORDER BY (t.id = :exactId) DESC, (TRIM(${ci('t.name')}) LIKE :prefix) DESC, TRIM(t.name) ASC
      LIMIT :limit`;

    const rows = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });

    const ids = rows.map((r) => r.id);
    const source = countSources[level];
    const [productCounts, childCounts] = await Promise.all([
      countByIds('products', source.productCol, ids),
      source.child ? countByIds(source.child.table, source.child.col, ids) : {},
    ]);

    res.json(rows.map((r) => ({
      ...r,
      name: (r.name || '').trim(),
      product_count: productCounts[r.id] || 0,
      child_count: childCounts[r.id] || 0,
    })));
  } catch (err) {
    handleError(res, err);
  }
};

exports.preview = async (req, res) => {
  try {
    const { action, level, source_id, target_id } = req.body;
    const result = await preview({ action, level, sourceId: source_id, targetId: target_id });
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
};

exports.apply = async (req, res) => {
  try {
    const { action, level, source_id, target_id, add_seller_mappings, admin_id } = req.body;
    const result = await apply(
      { action, level, sourceId: source_id, targetId: target_id },
      { addSellerMappings: add_seller_mappings !== false, adminId: admin_id || null }
    );
    res.json({
      message: `${LEVELS[level].label} ${action === 'move' ? 'moved' : 'merged'} successfully.`,
      ...result,
    });
  } catch (err) {
    handleError(res, err);
  }
};

// Turns "Component > Semiconductor Device" into segments, each resolved to its current node (ids + slugs)
// so every part of a history path can link to its website page. Names are unique per level, so a name
// lookup is reliable; a merged (soft deleted) record is renamed and simply stays unlinked.
const resolvePathSegments = async (paths) => {
  const namesByLevel = {};
  paths.forEach((path) => (path || '').split(' > ').forEach((name, i) => {
    const level = LEVEL_ORDER[i];
    if (!level || !name) return;
    (namesByLevel[level] = namesByLevel[level] || new Set()).add(name);
  }));

  const nodeByLevelName = {};
  await Promise.all(Object.entries(namesByLevel).map(async ([level, names]) => {
    const { table, pk } = LEVELS[level];
    const rows = await sequelize.query(
      `SELECT ${pk} AS id, name FROM ${table} WHERE name IN (:names) AND is_delete = 0`,
      { replacements: { names: [...names] }, type: QueryTypes.SELECT }
    );
    const nodes = await Promise.all(rows.map((r) => getNode(level, r.id)));
    rows.forEach((r, i) => { if (nodes[i]) nodeByLevelName[`${level}:${r.name}`] = nodes[i]; });
  }));

  return (path) => (path || '').split(' > ').map((name, i) => ({
    name,
    level: LEVEL_ORDER[i],
    node: nodeByLevelName[`${LEVEL_ORDER[i]}:${name}`] || null,
  }));
};

// Same presets as the other admin lists (dateRange=today|yesterday|last7days|last30days|thismonth|lastmonth|customrange).
const dateCondition = ({ dateRange, startDate, endDate }) => {
  const range = (dateRange || '').toString().toLowerCase().replace(/\s+/g, '');
  const now = moment();
  switch (range) {
    case 'today': return { [Op.gte]: moment().startOf('day').toDate(), [Op.lte]: now.toDate() };
    case 'yesterday': return { [Op.gte]: moment().subtract(1, 'day').startOf('day').toDate(), [Op.lte]: moment().subtract(1, 'day').endOf('day').toDate() };
    case 'last7days': return { [Op.gte]: moment().subtract(6, 'days').startOf('day').toDate(), [Op.lte]: now.toDate() };
    case 'last30days': return { [Op.gte]: moment().subtract(29, 'days').startOf('day').toDate(), [Op.lte]: now.toDate() };
    case 'thismonth': return { [Op.gte]: moment().startOf('month').toDate(), [Op.lte]: now.toDate() };
    case 'lastmonth': return { [Op.gte]: moment().subtract(1, 'month').startOf('month').toDate(), [Op.lte]: moment().subtract(1, 'month').endOf('month').toDate() };
    case 'customrange': {
      if (!startDate && !endDate) return null;
      const cond = {};
      if (startDate) cond[Op.gte] = moment(startDate).startOf('day').toDate();
      if (endDate) cond[Op.lte] = moment(endDate).endOf('day').toDate();
      return cond;
    }
    default: return null;
  }
};

// Admins who have run at least one operation, for the "Done by" filter.
exports.getLogAdmins = async (req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT DISTINCT a.admin_id AS id, a.name
       FROM category_restructure_logs l JOIN admins a ON a.admin_id = l.admin_id
       ORDER BY a.name`,
      { type: QueryTypes.SELECT }
    );
    res.json(rows);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getLogsServerSide = async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '', sortBy = 'id', sort = 'DESC' } = req.query;
    const validColumns = ['id', 'action', 'level', 'source_name', 'target_name', 'admin_id', 'created_at'];
    const order = [[validColumns.includes(sortBy) ? sortBy : 'id', sort === 'ASC' ? 'ASC' : 'DESC']];
    const limitValue = parseInt(limit, 10) || 25;
    const offset = (parseInt(page, 10) - 1) * limitValue;

    const where = {};
    const and = [];
    if (['move', 'merge'].includes(req.query.action)) where.action = req.query.action;
    if (LEVELS[req.query.level]) where.level = req.query.level;
    if (Number(req.query.admin_id) > 0) where.admin_id = Number(req.query.admin_id);

    const created = dateCondition(req.query);
    if (created) where.created_at = created;

    if (search) {
      and.push({
        [Op.or]: [
          { source_name: { [Op.like]: `%${search}%` } },
          { from_parent: { [Op.like]: `%${search}%` } },
          { target_name: { [Op.like]: `%${search}%` } },
        ],
      });
    }

    // Category filter: operations that came from or went to anywhere inside this category.
    if (Number(req.query.category_id) > 0) {
      const [category] = await sequelize.query(
        'SELECT name FROM categories WHERE category_id = :id',
        { replacements: { id: Number(req.query.category_id) }, type: QueryTypes.SELECT }
      );
      if (!category) return res.json({ data: [], totalRecords: await CategoryRestructureLog.count(), filteredRecords: 0 });
      const name = category.name;
      and.push({
        [Op.or]: [
          { from_parent: name }, { from_parent: { [Op.like]: `${name} > %` } },
          { target_name: name }, { target_name: { [Op.like]: `${name} > %` } },
        ],
      });
    }
    if (and.length) where[Op.and] = and;

    const totalRecords = await CategoryRestructureLog.count();
    const { count: filteredRecords, rows } = await CategoryRestructureLog.findAndCountAll({
      where, order, limit: limitValue, offset,
    });

    // Where the record lives now (moved record, or the merge target), for a "view on website" link.
    const views = await Promise.all(rows.map((row) => (
      LEVELS[row.level]
        ? getNode(row.level, row.action === 'merge' ? row.target_id : row.source_id).catch(() => null)
        : null
    )));

    const segmentsOf = await resolvePathSegments(rows.flatMap((row) => [row.from_parent, row.target_name]));

    const adminIds = [...new Set(rows.map((r) => r.admin_id).filter(Boolean))];
    const admins = adminIds.length
      ? await Admin.findAll({ where: { id: adminIds }, attributes: ['id', 'name'], raw: true })
      : [];
    const adminName = Object.fromEntries(admins.map((a) => [a.id, a.name]));

    res.json({
      data: rows.map((row, i) => ({
        ...row.toJSON(),
        level_label: LEVELS[row.level]?.label || row.level,
        affected: (() => { try { return JSON.parse(row.affected || '{}'); } catch { return {}; } })(),
        view: views[i],
        from_segments: segmentsOf(row.from_parent || row.source_name),
        to_segments: segmentsOf(row.target_name),
        admin_name: adminName[row.admin_id] || null,
      })),
      totalRecords,
      filteredRecords,
    });
  } catch (err) {
    handleError(res, err);
  }
};
