const sequelize = require('../config/database');

const SELLER_PERFORMANCE_TABLE = 'seller_performance';

// sequelize.sync() runs without { alter: true }, so columns added to a model
// after the table already exists on the server are silently ignored. This adds
// them in place, idempotently, on every boot.
const ENSURED_COLUMNS = [
  {
    column: 'search_appearance_count',
    ddl: '`search_appearance_count` INT NOT NULL DEFAULT 0',
  },
];

const escapeId = (name) => `\`${String(name).replace(/`/g, '')}\``;

async function getExistingColumns(table) {
  const rows = await sequelize.query(
    'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table',
    { replacements: { table }, type: sequelize.QueryTypes.SELECT }
  );
  return new Set(rows.map((r) => String(r.COLUMN_NAME || r.column_name).toLowerCase()));
}

async function ensureSellerPerformanceColumns() {
  const added = [];

  let existing;
  try {
    existing = await getExistingColumns(SELLER_PERFORMANCE_TABLE);
  } catch (err) {
    console.error('ensureSellerPerformanceColumns: unable to read table metadata:', err.message);
    return added;
  }
  if (existing.size === 0) {
    console.log('ensureSellerPerformanceColumns: seller_performance table not present, skipping');
    return added;
  }

  for (const { column, ddl } of ENSURED_COLUMNS) {
    if (existing.has(column.toLowerCase())) continue;
    try {
      await sequelize.query(
        `ALTER TABLE ${escapeId(SELLER_PERFORMANCE_TABLE)} ADD COLUMN ${ddl}`
      );
      added.push(column);
    } catch (err) {
      console.error(`ensureSellerPerformanceColumns: failed to add ${column}:`, err.message);
    }
  }

  if (added.length > 0) {
    console.log(`ensureSellerPerformanceColumns: added ${added.join(', ')} to seller_performance`);
  }
  return added;
}

module.exports = {
  SELLER_PERFORMANCE_TABLE,
  ENSURED_COLUMNS,
  ensureSellerPerformanceColumns,
};
