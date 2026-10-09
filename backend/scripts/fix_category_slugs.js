// One-time clean-up of the slugs the website opens pages by (Category Master levels, products,
// companies), so every slug is unique and the unique slug indexes can be added.
//
//   node scripts/fix_category_slugs.js            -> preview only, nothing is written
//   node scripts/fix_category_slugs.js --apply    -> writes the changes (one transaction) and
//                                                    adds the unique slug index
//
// Category Master levels:
//   1. deleted rows that still hold their name/slug: "-deleted-<id>" is added to both;
//   2. active rows whose name changed but whose slug did not (e.g. "Cable Ties-3" -> cable-ties);
//   3. active rows sharing a slug: the row the slug belongs to keeps it, the others get -2, -3 ...
// Products and companies (names may repeat, a deleted row keeps its slug):
//   - rows sharing a slug: an active row whose name makes the slug keeps it, the others get -2 ...
//   - rows with a name but no slug get one.
// Slugs that still match their name in an older format ("gas---chemical-sensors", "10ko") are
// kept, so working links do not change.
const sequelize = require('../config/database');
const { toSlug, deletedSuffix, ensureSlugIndexes } = require('../utils/categorySlug');

const CATEGORY_LEVEL = { nameCol: 'name', slugCol: 'slug', categoryLevel: true };
const TABLES = [
  { table: 'categories', pk: 'category_id', label: 'Category', ...CATEGORY_LEVEL },
  { table: 'sub_categories', pk: 'sub_category_id', label: 'Sub Category', ...CATEGORY_LEVEL },
  { table: 'item_category', pk: 'item_category_id', label: 'Item Category', ...CATEGORY_LEVEL },
  { table: 'item_subcategory', pk: 'item_subcategory_id', label: 'Item Sub Category', ...CATEGORY_LEVEL },
  { table: 'items', pk: 'item_id', label: 'Item', ...CATEGORY_LEVEL },
  // liveSql: the row whose page is open on the website keeps a shared slug.
  { table: 'products', pk: 'product_id', label: 'Product', nameCol: 'title', slugCol: 'slug', categoryLevel: false,
    liveSql: 'is_approve = 1 AND status = 1' },
  { table: 'company_info', pk: 'company_id', label: 'Company', nameCol: 'organization_name', slugCol: 'organization_slug', categoryLevel: false },
];

const hasText = (value) => Boolean(String(value ?? '').trim());

// Slug style of the old site: spaces and "/" became "-", brackets were kept.
const legacySlug = (name) => String(name || '').trim().toLowerCase().replace(/[\s/&,]/g, '-');
// A slug fits its name in the current or old style, also with a -2, -3 ... from de-duplication.
// Product slugs of the old site: anything but letters, digits, spaces and "-" dropped.
const legacyProductSlug = (name) => String(name || '').toLowerCase().trim()
  .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
const slugFitsName = (slug, name) => Boolean(slug) && [slug, slug.replace(/-\d+$/, '')].some((s) => (
  s === toSlug(name) || s === legacySlug(name) || s === legacyProductSlug(name) || s.replace(/-+/g, '-') === toSlug(name)
));

const planTable = (rows, def) => {
  const changes = new Map(); // id -> { name, slug, reason }
  const set = (row, values, reason) => {
    if (Object.entries(values).every(([key, value]) => row[key] === value) && !changes.has(row.id)) return;
    const current = changes.get(row.id) || { name: row.name, slug: row.slug, reasons: [] };
    Object.assign(current, values);
    current.reasons.push(reason);
    changes.set(row.id, current);
  };

  // 1. Deleted Category Master rows step aside.
  for (const row of rows.filter((r) => def.categoryLevel && Number(r.is_delete) === 1)) {
    const suffix = deletedSuffix(row.id);
    const name = String(row.name).endsWith(suffix) ? row.name : `${row.name}${suffix}`;
    const baseSlug = row.slug || toSlug(String(row.name).replace(suffix, ''));
    const slug = baseSlug.endsWith(suffix) ? baseSlug : `${baseSlug}${suffix}`;
    if (name !== row.name || slug !== row.slug) set(row, { name, slug }, 'deleted row frees its name/slug');
  }

  // 2 + 3. Rows needing a new slug: empty, out of date (Category Master), or sharing a slug.
  // Products and companies: deleted rows keep their slug, so they share the checks.
  const active = rows.filter((r) => Number(r.is_delete) === 0);
  const checked = def.categoryLevel ? active : rows;
  const needsSlug = new Set(checked
    .filter((r) => (def.categoryLevel ? !slugFitsName(r.slug, r.name) : !hasText(r.slug) && hasText(r.name)))
    .map((r) => r.id));
  const bySlug = new Map();
  checked.forEach((r) => {
    if (!r.slug) return;
    if (!bySlug.has(r.slug)) bySlug.set(r.slug, []);
    bySlug.get(r.slug).push(r);
  });
  for (const group of bySlug.values()) {
    if (group.length < 2) continue;
    // The slug stays with an active row whose own name makes it (oldest first); the others move.
    const rank = (r) => (Number(r.is_delete) === 0 ? 0 : 4) + (Number(r.live) === 1 ? 0 : 2)
      + (slugFitsName(r.slug, r.name) ? 0 : 1);
    const keeper = [...group].sort((a, b) => rank(a) - rank(b) || a.id - b.id)[0];
    group.filter((r) => r.id !== keeper.id).forEach((r) => needsSlug.add(r.id));
  }

  // Slugs in use once the above is done (moved rows give theirs up).
  const taken = new Set();
  rows.forEach((r) => {
    const planned = changes.get(r.id);
    const slug = planned ? planned.slug : r.slug;
    if (slug && !needsSlug.has(r.id)) taken.add(slug);
  });
  for (const row of checked.filter((r) => needsSlug.has(r.id)).sort((a, b) => a.id - b.id)) {
    if (!hasText(row.name)) continue; // nothing to make a slug from
    const base = toSlug(row.name) || 'item';
    let slug = base;
    for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`;
    taken.add(slug);
    const reason = !hasText(row.slug) ? 'empty slug'
      : (slugFitsName(row.slug, row.name) ? `shared slug "${row.slug}"` : `name changed, slug was "${row.slug}"`);
    set(row, { slug }, reason);
  }

  // A blank (not NULL) slug would clash with other blanks under the unique index.
  rows.filter((r) => r.slug !== null && !hasText(r.slug) && !changes.has(r.id))
    .forEach((r) => set(r, { slug: null }, 'blank slug cleared (no name to build one)'));
  return changes;
};

(async () => {
  const apply = process.argv.includes('--apply');
  const plans = [];
  for (const def of TABLES) {
    const [rows] = await sequelize.query(
      `SELECT \`${def.pk}\` AS id, \`${def.nameCol}\` AS name, \`${def.slugCol}\` AS slug, is_delete,
              ${def.liveSql ? `(${def.liveSql})` : '1'} AS live
       FROM \`${def.table}\` ORDER BY \`${def.pk}\``
    );
    const changes = planTable(rows, def);
    const byId = new Map(rows.map((r) => [r.id, r]));
    plans.push({ def, changes, byId });

    console.log(`\n=== ${def.label} (${def.table}): ${changes.size} change(s)`);
    for (const [id, c] of changes) {
      const before = byId.get(id);
      const nameText = c.name !== before.name ? ` | name: "${before.name}" -> "${c.name}"` : ` | "${before.name}"`;
      console.log(`  [${id}] slug: ${before.slug || '(empty)'} -> ${c.slug}${nameText}  (${c.reasons.join('; ')})`);
    }
  }

  const total = plans.reduce((sum, p) => sum + p.changes.size, 0);
  if (!apply) {
    console.log(`\nPreview only: ${total} row(s) would change. Run with --apply to write them.`);
    process.exit(0);
  }

  await sequelize.transaction(async (transaction) => {
    for (const { def, changes } of plans) {
      for (const [id, c] of changes) {
        await sequelize.query(
          `UPDATE \`${def.table}\` SET \`${def.nameCol}\` = ?, \`${def.slugCol}\` = ?, updated_at = NOW() WHERE \`${def.pk}\` = ?`,
          { replacements: [c.name, c.slug, id], transaction }
        );
      }
    }
  });
  console.log(`\nApplied: ${total} row(s) updated.`);
  const added = await ensureSlugIndexes(sequelize);
  console.log(`Unique slug index added: ${added.length ? added.join(', ') : 'none (already present or duplicates left)'}`);
  process.exit(0);
})().catch((err) => {
  console.error('fix_category_slugs failed:', err.message);
  process.exit(1);
});
