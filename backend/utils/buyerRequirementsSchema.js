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
  {
    // Where the product field's value came from. NULL on rows written before
    // this column existed, which reads the same as "not recorded".
    // The column name is backticked: `type` is a MySQL keyword.
    //
    // dataType is declared because this name was FREED by dropping an older,
    // unrelated `type` INTEGER column ('1=Service, 2=Product') - but that drop
    // was done by hand and is not reproducible from this repo. If the leftover
    // integer column is still on the server, ADD would be skipped (the name
    // already exists) and the 'admin'/'other' strings would be written into an
    // int. Declaring the expected type lets ensureBuyerRequirementColumns
    // repair that case instead of silently trusting it.
    column: 'type',
    dataType: 'varchar(20)',
    ddl: "`type` VARCHAR(20) NULL COMMENT 'admin = picked from the product list, other = buyer typed their own'",
  },
];

const escapeId = (name) => `\`${String(name).replace(/`/g, '')}\``;

// Returns a Map of lowercased column name -> lowercased COLUMN_TYPE.
async function getExistingColumns(table) {
  const rows = await sequelize.query(
    'SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table',
    { replacements: { table }, type: sequelize.QueryTypes.SELECT }
  );
  const columns = new Map();
  rows.forEach((r) => {
    const name = String(r.COLUMN_NAME || r.column_name).toLowerCase();
    const base = String(r.DATA_TYPE || r.data_type || '').toLowerCase();
    const length = r.CHARACTER_MAXIMUM_LENGTH ?? r.character_maximum_length;
    columns.set(name, length ? `${base}(${length})` : base);
  });
  return columns;
}

async function ensureBuyerRequirementColumns() {
  const added = [];
  const modified = [];

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

  for (const { column, dataType, ddl } of ENSURED_COLUMNS) {
    const key = column.toLowerCase();
    if (!existing.has(key)) {
      try {
        await sequelize.query(
          `ALTER TABLE ${escapeId(BUYER_REQUIREMENTS_TABLE)} ADD COLUMN ${ddl}`
        );
        added.push(column);
      } catch (err) {
        console.error(`ensureBuyerRequirementColumns: failed to add ${column}:`, err.message);
      }
      continue;
    }

    // Only enforced when the entry declares one, so entries without it keep
    // their original add-if-missing behaviour untouched.
    if (!dataType) continue;
    if (existing.get(key) === String(dataType).toLowerCase()) continue;

    try {
      await sequelize.query(
        `ALTER TABLE ${escapeId(BUYER_REQUIREMENTS_TABLE)} MODIFY COLUMN ${ddl}`
      );
      modified.push(column);
    } catch (err) {
      console.error(`ensureBuyerRequirementColumns: failed to correct ${column} type:`, err.message);
    }
  }

  if (added.length > 0) {
    console.log(`ensureBuyerRequirementColumns: added ${added.join(', ')} to buyer_requirements`);
  }
  if (modified.length > 0) {
    console.log(`ensureBuyerRequirementColumns: corrected column type for ${modified.join(', ')}`);
  }
  return added;
}

module.exports = {
  BUYER_REQUIREMENTS_TABLE,
  ENSURED_COLUMNS,
  ensureBuyerRequirementColumns,
};
