const slugify = require('slugify');
const { Op } = require('sequelize');

// One slug rule for every table opened by slug on the website:
// - the slug follows the name and is unique in its table (-2, -3 ... when taken);
// - Category Master levels (freeOnDelete): a deleted row moves out of the way with
//   "-deleted-<id>" on its name and slug, so both can be used again; restoring takes it off;
// - products and companies keep their slug when deleted, so a restore gets its old link back.
// Each table also carries a unique index on its slug column (ensureSlugIndexes) as the last guard.

const SLUG_OPTIONS = { lower: true, strict: true, remove: /[*+~.()'"!:@]/g };

const toSlug = (value) => slugify(String(value || ''), SLUG_OPTIONS);

const deletedSuffix = (id) => `-deleted-${id}`;
const stripDeletedSuffix = (value, id) => String(value || '').replace(new RegExp(`${deletedSuffix(id)}$`, 'i'), '');

// First free slug for this name: "power-supply", else "power-supply-2", "power-supply-3" ...
const uniqueSlug = async (Model, name, { excludeId = null, transaction = null, slugField = 'slug' } = {}) => {
  const base = toSlug(name) || 'item';
  const rows = await Model.findAll({
    where: {
      [slugField]: { [Op.like]: `${base}%` },
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
    },
    attributes: [slugField],
    raw: true,
    transaction,
  });
  const taken = new Set(rows.map((row) => row[slugField]));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) {
    if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
  }
};

// True when the field differs from its stored value. changed() alone misses values a bulk
// Model.update writes straight into the row before running individual hooks.
const fieldChanged = (record, field) => record.changed(field)
  || String(record.get(field)) !== String(record.previous(field));

const hasText = (value) => Boolean(String(value ?? '').trim());

const attachSlugHooks = (Model, { nameField = 'name', slugField = 'slug', freeOnDelete = false } = {}) => {
  const watched = freeOnDelete ? [nameField, 'is_delete'] : [nameField];

  // A bulk Model.update that changes the name (or deletes a Category Master row) runs the row
  // hooks below for every row. Without name and slug in fields, rows the hook changed
  // differently would be saved without them.
  Model.beforeBulkUpdate((options) => {
    const fields = options.fields || Object.keys(options.attributes || {});
    if (!fields.some((field) => watched.includes(field))) return;
    options.individualHooks = true;
    options.fields = [...new Set([...fields, nameField, slugField])];
  });

  Model.beforeCreate(async (record, options) => {
    const source = hasText(record.get(slugField)) ? record.get(slugField) : record.get(nameField);
    if (!hasText(source)) return;
    record.set(slugField, await uniqueSlug(Model, source, { transaction: options.transaction, slugField }));
  });

  Model.beforeUpdate(async (record, options) => {
    const { transaction } = options;
    const name = record.get(nameField);

    if (freeOnDelete && fieldChanged(record, 'is_delete')) {
      if (Number(record.is_delete) === 1) {
        const suffix = deletedSuffix(record.id);
        if (!String(name).endsWith(suffix)) record.set(nameField, `${name}${suffix}`);
        const slug = record.get(slugField) || toSlug(record.previous(nameField));
        if (!String(slug).endsWith(suffix)) record.set(slugField, `${slug}${suffix}`);
        return;
      }
      record.set(nameField, stripDeletedSuffix(name, record.id));
      const restoredSlug = stripDeletedSuffix(record.get(slugField), record.id);
      const taken = restoredSlug && await Model.count({
        where: { [slugField]: restoredSlug, id: { [Op.ne]: record.id } },
        transaction,
      });
      record.set(slugField, restoredSlug && !taken
        ? restoredSlug
        : await uniqueSlug(Model, record.get(nameField), { excludeId: record.id, transaction, slugField }));
      return;
    }

    // A new name, or a row that still has no slug, gets a fresh unique slug.
    if (hasText(name) && (fieldChanged(record, nameField) || !hasText(record.get(slugField)))) {
      record.set(slugField, await uniqueSlug(Model, name, { excludeId: record.id, transaction, slugField }));
    }
  });
};

// Category, Sub Category, Item Category, Item Sub Category, Item.
const attachCategorySlugHooks = (Model) => attachSlugHooks(Model, { freeOnDelete: true });

// Tables opened by slug on the website, and the slug column of each.
const SLUG_TABLES = [
  { table: 'categories', column: 'slug' },
  { table: 'sub_categories', column: 'slug' },
  { table: 'item_category', column: 'slug' },
  { table: 'item_subcategory', column: 'slug' },
  { table: 'items', column: 'slug' },
  { table: 'products', column: 'slug' },
  { table: 'company_info', column: 'organization_slug' },
];

// Unique index on each slug column, added once the data has no duplicate slugs left
// (scripts/fix_category_slugs.js clears them). Logged, never fatal, when duplicates remain.
const ensureSlugIndexes = async (sequelize) => {
  const added = [];
  for (const { table, column } of SLUG_TABLES) {
    const indexName = `uq_${table}_${column}`;
    try {
      const [existing] = await sequelize.query(`SHOW INDEX FROM \`${table}\` WHERE Key_name = ?`, { replacements: [indexName] });
      if (existing.length) continue;
      const [dupes] = await sequelize.query(
        `SELECT \`${column}\` AS slug, COUNT(*) AS c FROM \`${table}\` WHERE \`${column}\` IS NOT NULL
         GROUP BY \`${column}\` HAVING c > 1 LIMIT 5`
      );
      if (dupes.length) {
        console.warn(`[slugs] ${table}: duplicate slugs (${dupes.map((d) => d.slug || '(empty)').join(', ')}); `
          + 'run "node scripts/fix_category_slugs.js --apply" to add the unique slug index.');
        continue;
      }
      await sequelize.query(`ALTER TABLE \`${table}\` ADD UNIQUE INDEX \`${indexName}\` (\`${column}\`)`);
      added.push(table);
    } catch (err) {
      console.warn(`[slugs] ${table}: ${err.message}`);
    }
  }
  return added;
};

module.exports = {
  SLUG_OPTIONS,
  toSlug,
  deletedSuffix,
  stripDeletedSuffix,
  uniqueSlug,
  attachSlugHooks,
  attachCategorySlugHooks,
  SLUG_TABLES,
  ensureSlugIndexes,
};
