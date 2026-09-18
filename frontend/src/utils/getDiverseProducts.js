// =========================================================
// DIVERSIFY LATEST PRODUCTS FOR SLIDER
// ---------------------------------------------------------
// Takes a newer-first product list and returns up to `max`
// products picked round-robin across different
// item-subcategories, while capping how many products come
// from the same company (varied companies).
//
// Each candidate key can be customised via `field` so the
// same helper works for item_subcategory_id / company_id.
// =========================================================

export const getDiverseProducts = (products = [], max = 50) => {
  if (!Array.isArray(products) || products.length === 0) return [];

  const subCategoryKey = (p) =>
    p.item_subcategory_id != null && String(p.item_subcategory_id) !== ""
      ? String(p.item_subcategory_id)
      : "none";

  const companyKey = (p) =>
    p.company_id != null && String(p.company_id) !== ""
      ? String(p.company_id)
      : "unknown";

  // Never show more than 25% of the slider from one company
  const companyCap = Math.max(1, Math.ceil(max / 4));

  // Group by item-subcategory (newest-first within each group)
  const groups = new Map();
  products.forEach((p) => {
    const key = subCategoryKey(p);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  });

  const keys = [...groups.keys()];
  const pointers = new Array(keys.length).fill(0);
  let activeGroups = keys.length;

  const result = [];
  const companyCount = {};

  // Round-robin: take one product per subcategory group per pass
  while (result.length < max && activeGroups > 0) {
    let progressed = false;

    for (let i = 0; i < keys.length && result.length < max; i++) {
      const group = groups.get(keys[i]);
      if (pointers[i] >= group.length) continue;

      const candidate = group[pointers[i]];
      pointers[i] += 1;
      if (pointers[i] >= group.length) activeGroups -= 1;

      progressed = true;

      const company = companyKey(candidate);
      if ((companyCount[company] || 0) < companyCap) {
        result.push(candidate);
        companyCount[company] = (companyCount[company] || 0) + 1;
      }
    }

    // Safety: nothing left to pick
    if (!progressed) break;
  }

  // Fallback: still short, top up with remaining products
  // keeping newest-first order and never duplicating
  if (result.length < max) {
    const usedIds = new Set(result.map((p) => p.id));
    for (const p of products) {
      if (result.length >= max) break;
      if (usedIds.has(p.id)) continue;
      result.push(p);
    }
  }

  return result;
};

export default getDiverseProducts;