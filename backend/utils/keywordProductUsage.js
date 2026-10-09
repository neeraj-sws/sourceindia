const { Op, fn, col } = require('sequelize');
const Products = require('../models/Products');

// Products linked to each keyword through products.keyword_id, split into
// live and soft-deleted. Soft-deleted products still count as usage because
// restoring them would point back at the keyword.
const getKeywordProductCounts = async (keywordIds) => {
  const ids = [...new Set(keywordIds.map(Number).filter((id) => id > 0))];
  const counts = new Map(ids.map((id) => [id, { product_count: 0, deleted_product_count: 0 }]));
  if (!ids.length) return counts;

  const rows = await Products.findAll({
    where: { keyword_id: { [Op.in]: ids } },
    attributes: ['keyword_id', 'is_delete', [fn('COUNT', col('product_id')), 'count']],
    group: ['keyword_id', 'is_delete'],
    raw: true,
  });
  rows.forEach((row) => {
    const entry = counts.get(Number(row.keyword_id));
    if (!entry) return;
    if (Number(row.is_delete) === 1) entry.deleted_product_count += Number(row.count);
    else entry.product_count += Number(row.count);
  });
  return counts;
};

const totalUsage = ({ product_count, deleted_product_count }) => product_count + deleted_product_count;

// Adds product_count, deleted_product_count and is_used to each keyword row.
const withProductUsage = async (keywords) => {
  const counts = await getKeywordProductCounts(keywords.map((k) => k.id));
  return keywords.map((keyword) => {
    const usage = counts.get(Number(keyword.id)) || { product_count: 0, deleted_product_count: 0 };
    return { ...keyword, ...usage, is_used: totalUsage(usage) > 0 };
  });
};

// Returns a 409 message when any of the keywords is linked to a product, else null.
const keywordUsageConflict = async (keywords, action) => {
  const counts = await getKeywordProductCounts(keywords.map((k) => k.id));
  const total = [...counts.values()].reduce((sum, usage) => sum + totalUsage(usage), 0);
  if (!total) return null;
  return keywords.length === 1
    ? `Product Keyword cannot be ${action} because it is used in ${total} product(s).`
    : `Selected Product Keywords cannot be ${action} because one or more are used in ${total} product(s).`;
};

module.exports = { withProductUsage, keywordUsageConflict };
