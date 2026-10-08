// A product is on the website only when Active + Approved and not deleted.
const isProductLive = (product) => Boolean(product)
  && Number(product.is_approve) === 1
  && Number(product.status) === 1
  && Number(product.is_delete) !== 1;

// Where clause for the same rule.
const LIVE_PRODUCT_WHERE = { is_approve: 1, status: 1, is_delete: 0 };

module.exports = { isProductLive, LIVE_PRODUCT_WHERE };
