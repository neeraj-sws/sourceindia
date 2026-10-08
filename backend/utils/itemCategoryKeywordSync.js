const { Op, fn, col } = require('sequelize');
const sequelize = require('../config/database');
const ProductKeywordCategory = require('../models/ProductKeywordCategory');

// Item Category keywords (Keyword Master > Product Keyword Category) live in product_keywords
// with item_subcategory_id = 0 and item_category_id set. This mirrors mainProductKeywordSync.js,
// which does the same for Item Sub Categories.
const OWN_ROWS = { item_subcategory_id: 0, item_category_id: { [Op.gt]: 0 } };

const normalizeName = (name) => (name || '').toString().trim().toLowerCase();

// product_keywords gets its item_category_id column the first time it is needed.
let schemaReady = null;
const ensureKeywordItemCategoryColumn = () => {
  if (!schemaReady) {
    schemaReady = (async () => {
      const columns = await sequelize.getQueryInterface().describeTable('product_keywords');
      if (!Object.prototype.hasOwnProperty.call(columns, 'item_category_id')) {
        await sequelize.query(
          `ALTER TABLE product_keywords
             ADD COLUMN item_category_id INT(11) NOT NULL DEFAULT 0 AFTER item_subcategory_id,
             ADD INDEX idx_product_keywords_item_category (item_category_id)`
        );
      }
    })().catch((err) => {
      schemaReady = null; // retry on the next call
      throw err;
    });
  }
  return schemaReady;
};

// The Item Category's own name is its main keyword: created, renamed and re-statused with it.
const syncItemCategoryMainKeyword = async (itemCategory) => {
  const name = (itemCategory?.name || '').toString().trim();
  if (!itemCategory?.id || !name) return null;
  await ensureKeywordItemCategoryColumn();
  const status = Number(itemCategory.status) === 0 ? 0 : 1;

  let keyword = await ProductKeywordCategory.findOne({
    where: { ...OWN_ROWS, item_category_id: itemCategory.id, is_main: 1 },
  });
  // Promote a matching manual keyword so the name is not duplicated.
  if (!keyword) {
    keyword = await ProductKeywordCategory.findOne({
      where: {
        ...OWN_ROWS,
        item_category_id: itemCategory.id,
        [Op.and]: [sequelize.where(fn('LOWER', fn('TRIM', col('name'))), normalizeName(name))],
      },
    });
  }

  if (keyword) {
    if (keyword.name !== name || Number(keyword.status) !== status || Number(keyword.is_main) !== 1) {
      keyword.name = name;
      keyword.status = status;
      keyword.is_main = 1;
      await keyword.save({ fields: ['name', 'status', 'is_main', 'updated_at'] });
    }
    return keyword;
  }
  return ProductKeywordCategory.create({
    name,
    item_subcategory_id: 0,
    item_category_id: itemCategory.id,
    status,
    is_main: 1,
  });
};

// Removes only the main keyword, like deleteMainProductKeywords does for Item Sub Categories.
const deleteItemCategoryMainKeywords = async (itemCategoryIds) => {
  const ids = (Array.isArray(itemCategoryIds) ? itemCategoryIds : [itemCategoryIds])
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
  if (!ids.length) return 0;
  await ensureKeywordItemCategoryColumn();
  return ProductKeywordCategory.destroy({
    where: { ...OWN_ROWS, item_category_id: { [Op.in]: ids }, is_main: 1 },
  });
};

module.exports = {
  ensureKeywordItemCategoryColumn,
  syncItemCategoryMainKeyword,
  deleteItemCategoryMainKeywords,
};
