const sequelize = require('../config/database');

const BUYER_REQUIREMENTS_TABLE = 'buyer_requirements';

// sequelize.sync() runs without { alter: true }, so columns added to a model
// after the table already exists on the server are silently ignored. This adds
// them in place, idempotently, on every boot.
const ENSURED_COLUMNS = [
  {
    column: 'buyer_pincode',
    ddl: '`buyer_pincode` VARCHAR(10) NULL',
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

async function ensureBuyerRequirementColumns() {
  const added = [];

  let existing;
  try {
    existing = await getExistingColumns(BUYER_REQUIREMENTS_TABLE);
  } catch (err) {
    console.error('ensureBuyerRequirementColumns: unable to read table metadata:', err.message);
    return added;
  }
  if (existing.size === 0) {
    console.log('ensureBuyerRequirementColumns: buyer_requirements table not present, skipping');
    return added;
  }

  for (const { column, ddl } of ENSURED_COLUMNS) {
    if (existing.has(column.toLowerCase())) continue;
    try {
      await sequelize.query(
        `ALTER TABLE ${escapeId(BUYER_REQUIREMENTS_TABLE)} ADD COLUMN ${ddl}`
      );
      added.push(column);
    } catch (err) {
      console.error(`ensureBuyerRequirementColumns: failed to add ${column}:`, err.message);
    }
  }

  if (added.length > 0) {
    console.log(`ensureBuyerRequirementColumns: added ${added.join(', ')} to buyer_requirements`);
  }
  return added;
}

module.exports = {
  BUYER_REQUIREMENTS_TABLE,
  ENSURED_COLUMNS,
  ensureBuyerRequirementColumns,
};
