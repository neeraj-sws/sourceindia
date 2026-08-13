const { Op } = require('sequelize');
const CategoryConflictLog = require('../models/CategoryConflictLog');

const normalizeName = (name) => (name || '').toString().trim().toLowerCase();

const findCategoryNameConflict = async (name, models, excludeId = null, transaction = null) => {
  const normalizedName = normalizeName(name);
  if (!normalizedName) return null;

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
    if (rows.some((row) => normalizeName(row.name) === normalizedName)) {
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

module.exports = { findCategoryNameConflict, logCategoryConflict };
