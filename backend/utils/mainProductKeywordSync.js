const { Op, fn, col } = require('sequelize');
const ProductKeyword = require('../models/ProductKeyword');
const sequelize = require('../config/database');

const normalizeName = (name) => (name || '').toString().trim().toLowerCase();

const syncMainProductKeyword = async (itemSubCategory) => {
  const name = (itemSubCategory?.name || '').toString().trim();
  if (!itemSubCategory?.id || !name) return null;

  let keyword = await ProductKeyword.findOne({
    where: { item_subcategory_id: itemSubCategory.id, is_main: 1 },
    attributes: ['id', 'name', 'item_subcategory_id', 'status', 'is_main'],
  });

  // Promote a legacy matching keyword so existing data is not duplicated.
  if (!keyword) {
    keyword = await ProductKeyword.findOne({
      where: {
        item_subcategory_id: itemSubCategory.id,
        [Op.and]: [sequelize.where(fn('LOWER', col('name')), normalizeName(name))],
      },
      attributes: ['id', 'name', 'item_subcategory_id', 'status', 'is_main'],
    });
  }

  if (keyword) {
    keyword.name = name;
    keyword.status = Number(itemSubCategory.status) === 0 ? 0 : 1;
    keyword.is_main = 1;
    await keyword.save({ fields: ['name', 'status', 'is_main', 'updated_at'] });
    return keyword;
  }

  return ProductKeyword.create(
    {
      name,
      item_subcategory_id: itemSubCategory.id,
      status: Number(itemSubCategory.status) === 0 ? 0 : 1,
      is_main: 1,
    },
    { fields: ['name', 'item_subcategory_id', 'status', 'is_main'] }
  );
};

const deleteMainProductKeywords = async (itemSubCategoryIds) => {
  const ids = (Array.isArray(itemSubCategoryIds) ? itemSubCategoryIds : [itemSubCategoryIds])
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);

  if (!ids.length) return 0;
  return ProductKeyword.destroy({
    where: { item_subcategory_id: { [Op.in]: ids }, is_main: 1 },
    force: true,
  });
};

const backfillMainProductKeywords = async () => {
  const [result] = await sequelize.query(`
    UPDATE product_keywords AS pk
    INNER JOIN item_subcategory AS isc
      ON isc.item_subcategory_id = pk.item_subcategory_id
    SET
      pk.is_main = 1,
      pk.status = isc.status,
      pk.updated_at = CURRENT_TIMESTAMP
    WHERE COALESCE(pk.is_main, 0) <> 1
      AND LOWER(TRIM(pk.name)) = LOWER(TRIM(isc.name))
  `);

  return Number(result?.affectedRows ?? result ?? 0);
};

module.exports = {
  syncMainProductKeyword,
  deleteMainProductKeywords,
  backfillMainProductKeywords,
};
