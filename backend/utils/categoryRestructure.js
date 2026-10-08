const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const ItemCategory = require('../models/ItemCategory');
const ItemSubCategory = require('../models/ItemSubCategory');
const Items = require('../models/Items');
const CategoryRestructureLog = require('../models/CategoryRestructureLog');

// Hierarchy order: every level's parent is the one before it.
const LEVEL_ORDER = ['category', 'sub_category', 'item_category', 'item_sub_category', 'item'];

const LEVELS = {
  category: { label: 'Category', table: 'categories', pk: 'category_id', model: Categories },
  sub_category: { label: 'Sub Category', table: 'sub_categories', pk: 'sub_category_id', model: SubCategories },
  item_category: { label: 'Item Category', table: 'item_category', pk: 'item_category_id', model: ItemCategory },
  item_sub_category: { label: 'Item Sub Category', table: 'item_subcategory', pk: 'item_subcategory_id', model: ItemSubCategory },
  item: { label: 'Item', table: 'items', pk: 'item_id', model: Items },
};

// Every table that stores a hierarchy id, and which column holds which level.
// The entity tables list their own primary key too, so a move also re-parents the moved row itself.
const LINKED_TABLES = [
  { table: 'categories', label: 'Categories', cols: { category: 'category_id' } },
  { table: 'sub_categories', label: 'Sub Categories', cols: { category: 'category', sub_category: 'sub_category_id' } },
  { table: 'item_category', label: 'Item Categories', cols: { category: 'category_id', sub_category: 'subcategory_id', item_category: 'item_category_id' } },
  { table: 'item_subcategory', label: 'Item Sub Categories', cols: { category: 'category_id', sub_category: 'subcategory_id', item_category: 'item_category_id', item_sub_category: 'item_subcategory_id' } },
  { table: 'items', label: 'Items', cols: { category: 'category_id', sub_category: 'subcategory_id', item_category: 'item_category_id', item_sub_category: 'item_sub_category_id', item: 'item_id' } },
  { table: 'products', label: 'Products', cols: { category: 'category', sub_category: 'sub_category', item_category: 'item_category_id', item_sub_category: 'item_subcategory_id', item: 'item_id' } },
  { table: 'seller_categories', label: 'Seller Categories', cols: { category: 'category_id', sub_category: 'subcategory_id' } },
  { table: 'buyer_sourcing_interests', label: 'Buyer Sourcing Interests', cols: { item_category: 'item_category_id', item_sub_category: 'item_subcategory_id' } },
  { table: 'product_keywords', label: 'Product Keywords', cols: { item_sub_category: 'item_subcategory_id' } },
];

// Levels whose move changes a product's category / sub category, so sellers may need the new mapping.
const SELLER_MAPPING_LEVELS = ['item_category', 'item_sub_category', 'item'];

class RestructureError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const parentLevelOf = (level) => LEVEL_ORDER[LEVEL_ORDER.indexOf(level) - 1] || null;
const ancestorsOf = (level) => LEVEL_ORDER.slice(0, LEVEL_ORDER.indexOf(level));

const pathSelect = {
  category: `SELECT c.category_id AS category, c.name AS name, c.name AS path,
      c.slug AS category_slug
    FROM categories c WHERE c.category_id = :id AND c.is_delete = 0`,
  sub_category: `SELECT sc.category AS category, sc.sub_category_id AS sub_category, sc.name AS name,
      CONCAT_WS(' > ', c.name, sc.name) AS path,
      c.slug AS category_slug, sc.slug AS sub_category_slug
    FROM sub_categories sc LEFT JOIN categories c ON c.category_id = sc.category
    WHERE sc.sub_category_id = :id AND sc.is_delete = 0`,
  item_category: `SELECT ic.category_id AS category, ic.subcategory_id AS sub_category, ic.item_category_id AS item_category,
      ic.name AS name, CONCAT_WS(' > ', c.name, sc.name, ic.name) AS path,
      c.slug AS category_slug, sc.slug AS sub_category_slug, ic.slug AS item_category_slug
    FROM item_category ic
    LEFT JOIN sub_categories sc ON sc.sub_category_id = ic.subcategory_id
    LEFT JOIN categories c ON c.category_id = ic.category_id
    WHERE ic.item_category_id = :id AND ic.is_delete = 0`,
  item_sub_category: `SELECT isc.category_id AS category, isc.subcategory_id AS sub_category, isc.item_category_id AS item_category,
      isc.item_subcategory_id AS item_sub_category, isc.name AS name,
      CONCAT_WS(' > ', c.name, sc.name, ic.name, isc.name) AS path,
      c.slug AS category_slug, sc.slug AS sub_category_slug, ic.slug AS item_category_slug,
      isc.slug AS item_sub_category_slug
    FROM item_subcategory isc
    LEFT JOIN item_category ic ON ic.item_category_id = isc.item_category_id
    LEFT JOIN sub_categories sc ON sc.sub_category_id = isc.subcategory_id
    LEFT JOIN categories c ON c.category_id = isc.category_id
    WHERE isc.item_subcategory_id = :id AND isc.is_delete = 0`,
  item: `SELECT it.category_id AS category, it.subcategory_id AS sub_category, it.item_category_id AS item_category,
      it.item_sub_category_id AS item_sub_category, it.item_id AS item, it.name AS name,
      CONCAT_WS(' > ', c.name, sc.name, ic.name, isc.name, it.name) AS path,
      c.slug AS category_slug, sc.slug AS sub_category_slug, ic.slug AS item_category_slug,
      isc.slug AS item_sub_category_slug, it.slug AS item_slug
    FROM items it
    LEFT JOIN item_subcategory isc ON isc.item_subcategory_id = it.item_sub_category_id
    LEFT JOIN item_category ic ON ic.item_category_id = it.item_category_id
    LEFT JOIN sub_categories sc ON sc.sub_category_id = it.subcategory_id
    LEFT JOIN categories c ON c.category_id = it.category_id
    WHERE it.item_id = :id AND it.is_delete = 0`,
};

// Returns the full ancestor path of a node, e.g. { category: 3, sub_category: 12, name, path }.
const getNode = async (level, id, transaction) => {
  const [row] = await sequelize.query(pathSelect[level], {
    replacements: { id },
    type: QueryTypes.SELECT,
    transaction,
  });
  return row || null;
};

const toId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// Validates the request and works out the source node, the target node and the new ancestor path.
const resolveOperation = async ({ action, level, sourceId, targetId }, transaction) => {
  if (!['move', 'merge'].includes(action)) throw new RestructureError('Action must be "move" or "merge".');
  if (!LEVELS[level]) throw new RestructureError('Invalid level.');
  if (action === 'move' && level === 'category') {
    throw new RestructureError('A category is the top level and cannot be moved. Use merge instead.');
  }

  const srcId = toId(sourceId);
  const tgtId = toId(targetId);
  if (!srcId || !tgtId) throw new RestructureError('Source and target are required.');

  const targetLevel = action === 'move' ? parentLevelOf(level) : level;
  const [source, target] = await Promise.all([
    getNode(level, srcId, transaction),
    getNode(targetLevel, tgtId, transaction),
  ]);
  if (!source) throw new RestructureError(`${LEVELS[level].label} not found.`, 404);
  if (!target) throw new RestructureError(`Target ${LEVELS[targetLevel].label} not found.`, 404);

  if (action === 'merge' && srcId === tgtId) {
    throw new RestructureError('Source and target must be different.');
  }
  if (action === 'move' && Number(source[targetLevel]) === tgtId) {
    throw new RestructureError(`${source.name} is already under ${target.name}.`);
  }

  // New values for the ancestor columns (and, for merge, the level's own column).
  const newPath = {};
  ancestorsOf(level).forEach((lvl) => { newPath[lvl] = Number(target[lvl]); });
  if (action === 'merge') newPath[level] = tgtId;

  return { action, level, targetLevel, srcId, tgtId, source, target, newPath };
};

// Builds the list of UPDATE statements for an operation. Each step only touches rows that point at the source.
const buildSteps = (op) => {
  const { action, level, srcId, newPath } = op;
  const steps = [];

  LINKED_TABLES.forEach((linked) => {
    const keyCol = linked.cols[level];
    if (!keyCol) return;
    // For merge, the source's own row is soft deleted separately, never re-pointed.
    if (action === 'merge' && linked.table === LEVELS[level].table) return;

    const sets = Object.entries(newPath)
      .filter(([lvl]) => linked.cols[lvl])
      .map(([lvl, value]) => ({ col: linked.cols[lvl], value }));
    if (!sets.length) return;

    steps.push({
      table: linked.table,
      label: linked.label,
      where: `${keyCol} = :srcId`,
      sets,
    });
  });

  return steps.map((step) => ({ ...step, replacements: { srcId } }));
};

const describeChanges = (op) => {
  const changes = [];
  const { action, level, source, target, newPath } = op;
  if (action === 'move') {
    changes.push(`"${source.name}" will move from "${source.path}" to "${target.path} > ${source.name}".`);
  } else {
    changes.push(`Everything under "${source.path}" will be re-linked to "${target.path}".`);
    changes.push(`"${source.name}" will then be soft deleted.`);
  }
  if (level === 'item_sub_category' && action === 'merge') {
    changes.push(`The main keyword of "${source.name}" will be removed; its other keywords move to "${target.name}".`);
  }
  if (newPath.category && Number(source.category) !== newPath.category) {
    changes.push('Product category / sub category links and seller category mappings are updated to the new path.');
  }
  return changes;
};

const sellerMappingTarget = (op) => {
  if (!SELLER_MAPPING_LEVELS.includes(op.level)) return null;
  const { newPath, source } = op;
  const category = newPath.category;
  const subCategory = newPath.sub_category;
  if (!category || !subCategory) return null;
  if (Number(source.category) === category && Number(source.sub_category) === subCategory) return null;
  return { category, subCategory, productCol: LINKED_TABLES.find((t) => t.table === 'products').cols[op.level] };
};

const sellerMappingWhere = `p.%COL% = :srcId AND p.is_delete = 0 AND p.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM seller_categories sc
    WHERE sc.user_id = p.user_id AND sc.category_id = :category AND sc.subcategory_id = :subCategory
  )`;

// Fields of a node that identify one level (id + slug), used by the admin page to build website links.
const LEVEL_FIELDS = {
  category: ['category', 'category_slug'],
  sub_category: ['sub_category', 'sub_category_slug'],
  item_category: ['item_category', 'item_category_slug'],
  item_sub_category: ['item_sub_category', 'item_sub_category_slug'],
  item: ['item', 'item_slug'],
};

const pickLevels = (node, levels) => {
  const out = {};
  levels.forEach((lvl) => LEVEL_FIELDS[lvl].forEach((f) => { out[f] = node[f]; }));
  return out;
};

// Where the record sits before and after, plus its old and new parent, for "check it on the website" links.
const buildLinkNodes = (op) => {
  const { action, level, source, target } = op;
  const ancestors = ancestorsOf(level);
  const after = action === 'move'
    ? { ...pickLevels(target, ancestors), ...pickLevels(source, [level]), name: source.name, path: `${target.path} > ${source.name}` }
    : target;
  const parent = parentLevelOf(level);
  return {
    level,
    parentLevel: parent,
    before: source,
    after,
    oldParent: parent ? { ...pickLevels(source, ancestors), path: source.path.split(' > ').slice(0, -1).join(' > ') } : null,
    newParent: parent
      ? (action === 'move' ? target : { ...pickLevels(target, ancestors), path: target.path.split(' > ').slice(0, -1).join(' > ') })
      : null,
  };
};

const productColFor = (level) => LINKED_TABLES.find((t) => t.table === 'products').cols[level];

const preview = async (payload) => {
  const op = await resolveOperation(payload);
  const steps = buildSteps(op);

  const counts = await Promise.all(steps.map(async (step) => {
    const [row] = await sequelize.query(
      `SELECT COUNT(*) AS count FROM ${step.table} WHERE ${step.where}`,
      { replacements: step.replacements, type: QueryTypes.SELECT }
    );
    return { table: step.table, label: step.label, count: Number(row.count) };
  }));

  let sellerMappings = null;
  const mapping = sellerMappingTarget(op);
  if (mapping) {
    const [row] = await sequelize.query(
      `SELECT COUNT(DISTINCT p.user_id) AS count FROM products p
       WHERE ${sellerMappingWhere.replace('%COL%', mapping.productCol)}`,
      { replacements: { srcId: op.srcId, category: mapping.category, subCategory: mapping.subCategory }, type: QueryTypes.SELECT }
    );
    sellerMappings = Number(row.count);
  }

  const productCol = productColFor(op.level);
  const [products, [productTotal]] = await Promise.all([
    sequelize.query(
      `SELECT product_id AS id, title, slug, is_approve, status FROM products
       WHERE ${productCol} = :srcId AND is_delete = 0 ORDER BY title ASC LIMIT 50`,
      { replacements: { srcId: op.srcId }, type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT COUNT(*) AS count FROM products WHERE ${productCol} = :srcId AND is_delete = 0`,
      { replacements: { srcId: op.srcId }, type: QueryTypes.SELECT }
    ),
  ]);

  return {
    action: op.action,
    level: op.level,
    source: { id: op.srcId, name: op.source.name, path: op.source.path },
    target: { id: op.tgtId, name: op.target.name, path: op.target.path },
    changes: describeChanges(op),
    counts: counts.filter((c) => c.count > 0),
    sellerMappings,
    links: buildLinkNodes(op),
    products: { total: Number(productTotal.count), rows: products },
  };
};

const apply = async (payload, { addSellerMappings = true, adminId = null } = {}) => {
  const transaction = await sequelize.transaction();
  try {
    const op = await resolveOperation(payload, transaction);
    const affected = {};

    // Seller mappings are computed before products move, while they still point at the source.
    const mapping = addSellerMappings ? sellerMappingTarget(op) : null;
    if (mapping) {
      const [, inserted] = await sequelize.query(
        `INSERT INTO seller_categories (uuid, user_id, category_id, subcategory_id, created_at, updated_at)
         SELECT UUID(), p.user_id, :category, :subCategory, NOW(), NOW()
         FROM products p
         WHERE ${sellerMappingWhere.replace('%COL%', mapping.productCol)}
         GROUP BY p.user_id`,
        { replacements: { srcId: op.srcId, category: mapping.category, subCategory: mapping.subCategory }, transaction }
      );
      affected.seller_categories_added = Number(inserted?.affectedRows ?? inserted ?? 0);
    }

    if (op.action === 'merge' && op.level === 'item_sub_category') {
      const [result] = await sequelize.query(
        'DELETE FROM product_keywords WHERE item_subcategory_id = :srcId AND is_main = 1',
        { replacements: { srcId: op.srcId }, transaction }
      );
      affected.product_keywords_main_removed = Number(result?.affectedRows ?? 0);
    }

    for (const step of buildSteps(op)) {
      const setSql = step.sets.map((s, i) => `${s.col} = :v${i}`).join(', ');
      const replacements = { ...step.replacements };
      step.sets.forEach((s, i) => { replacements[`v${i}`] = s.value; });
      const [result] = await sequelize.query(
        `UPDATE ${step.table} SET ${setSql} WHERE ${step.where}`,
        { replacements, transaction }
      );
      affected[step.table] = Number(result?.affectedRows ?? 0);
    }

    // Re-pointing can leave the same user with two identical mappings; keep the oldest one.
    if (op.newPath.category) {
      const [result] = await sequelize.query(
        `DELETE a FROM seller_categories a
         JOIN seller_categories b
           ON a.user_id = b.user_id AND a.category_id = b.category_id
          AND a.subcategory_id <=> b.subcategory_id
          AND a.seller_category_id > b.seller_category_id
         WHERE a.category_id = :category`,
        { replacements: { category: op.newPath.category }, transaction }
      );
      const removed = Number(result?.affectedRows ?? 0);
      if (removed) affected.seller_categories_duplicates_removed = removed;
    }
    if (op.newPath.item_category) {
      const [result] = await sequelize.query(
        `DELETE a FROM buyer_sourcing_interests a
         JOIN buyer_sourcing_interests b
           ON a.user_id = b.user_id AND a.item_category_id = b.item_category_id
          AND a.item_subcategory_id <=> b.item_subcategory_id
          AND a.buyer_sourcing_interest_id > b.buyer_sourcing_interest_id
         WHERE a.item_category_id = :itemCategory`,
        { replacements: { itemCategory: op.newPath.item_category }, transaction }
      );
      const removed = Number(result?.affectedRows ?? 0);
      if (removed) affected.buyer_sourcing_interests_duplicates_removed = removed;
    }

    if (op.action === 'merge') {
      // Instance save so the model hook renames it to "<name>-deleted-<id>" and frees the name.
      // Explicit attributes: a shared association adds a non-existent file_id column to Categories.
      const sourceRow = await LEVELS[op.level].model.findByPk(op.srcId, {
        attributes: ['id', 'name', 'slug', 'is_delete'],
        transaction,
      });
      sourceRow.is_delete = 1;
      await sourceRow.save({ transaction });
    }

    const log = await CategoryRestructureLog.create({
      action: op.action,
      level: op.level,
      source_id: op.srcId,
      source_name: op.source.name,
      from_parent: op.source.path,
      target_id: op.tgtId,
      target_name: op.target.path,
      affected: JSON.stringify(affected),
      admin_id: adminId,
    }, { transaction });

    await transaction.commit();
    return { logId: log.id, affected, source: op.source.path, target: op.target.path };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

module.exports = {
  LEVELS,
  LEVEL_ORDER,
  RestructureError,
  parentLevelOf,
  getNode,
  preview,
  apply,
};
