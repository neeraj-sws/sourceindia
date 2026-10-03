const { Op } = require('sequelize');
const Units = require('../models/Units');

// Seeded once so the Post Buy Requirement dropdown has content on a fresh
// database. Existing rows are never modified or deleted: if a unit is renamed
// or deactivated later, a restart must not silently undo that.
const DEFAULT_UNITS = [
  'Bag', 'Bale', 'Barrel', 'Box', 'Bundle', 'Carat', 'Carton', 'Centimeter',
  'Chain', 'Cubic Feet', 'Cubic Meter', 'Dozen', 'Each', 'Feet', 'Gallon',
  'Gram', 'Hectare', 'Kilogram', 'Kiloliter', 'Kilometer', 'Kit', 'Liter',
  'Long Ton', 'Meter', 'Metric Ton', 'Milligram', 'Milliliter', 'Millimeter',
  'Number', 'Ounce', 'Pair', 'Piece', 'Pound', 'Quintal', 'Roll', 'Set',
  'Short Ton', 'Square Feet', 'Square Meter', 'Square Yard', 'Ton', 'Tonne',
  'Unit', 'Yard',
];

const seedUnits = async () => {
  const existing = await Units.findAll({
    attributes: ['name'],
    where: { name: { [Op.in]: DEFAULT_UNITS } },
  });

  const existingNames = new Set(existing.map((row) => row.name));
  const missing = DEFAULT_UNITS.filter((name) => !existingNames.has(name));

  if (!missing.length) return 0;

  await Units.bulkCreate(missing.map((name) => ({ name, is_active: 1 })));
  return missing.length;
};

module.exports = {
  DEFAULT_UNITS,
  seedUnits,
};
