const { Op } = require('sequelize');
const CategoryConflictLog = require('../models/CategoryConflictLog');
const { toSlug } = require('./categorySlug');

const normalizeName = (name) => (name || '').toString().trim().toLowerCase();

const findCategoryNameConflict = async (name, models, excludeId = null, transaction = null) => {
  const normalizedName = normalizeName(name);
  if (!normalizedName) return null;
  // Names that only differ in punctuation ("Common Mode Choke" / "Common-mode Choke",
  // "&" / "and") make the same slug, so they count as the same name.
  const nameSlug = toSlug(name);

  const result = await Promise.all(models.map((entry) => entry.model.findAll({
    where: {
      is_delete: 0,
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
    },
    attributes: ['id', 'name'],
    transaction,
  })));

  for (let i = 0; i < result.length; i += 1) {
    const rows = result[i];
    if (rows.some((row) => normalizeName(row.name) === normalizedName || (nameSlug && toSlug(row.name) === nameSlug))) {
      return {
        conflictModule: models[i].module,
        conflictFlow: models.map((item) => item.module).join(' | '),
      };
    }
  }

  return null;
};

const logCategoryConflict = async ({ sourceModule, conflictModule, conflictFlow, conflictName }, transaction = null) => {
  try {
    await CategoryConflictLog.create({
      source_module: sourceModule,
      conflict_module: conflictModule,
      conflict_flow: conflictFlow,
      conflict_name: conflictName,
    }, transaction ? { transaction } : undefined);
  } catch (error) {
    console.error('Failed to write category conflict log:', error.message);
  }
};

// The four Category Master levels whose names must not repeat across each other.
const categoryLevelModels = () => [
  { model: require('../models/Categories'), module: 'Category' },
  { model: require('../models/SubCategories'), module: 'Sub Category' },
  { model: require('../models/ItemCategory'), module: 'Item Category' },
  { model: require('../models/ItemSubCategory'), module: 'Item Sub Category' },
];

// Before a deleted row is restored: its name without "-deleted-<id>" must still be free among
// the active rows of the given levels. Returns a message for the admin, or null.
const findRestoreNameConflict = async (record, models) => {
  const restoredName = String(record.name || '').replace(new RegExp(`-deleted-${record.id}$`, 'i'), '');
  const conflict = await findCategoryNameConflict(restoredName, models);
  if (!conflict) return null;
  return `Cannot restore "${restoredName}": an active ${conflict.conflictModule} with this name already exists. `
    + 'Rename or delete that one first.';
};

module.exports = { findCategoryNameConflict, logCategoryConflict, categoryLevelModels, findRestoreNameConflict };
