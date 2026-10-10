// Filters of the admin Category Master lists (Category, Sub Category, Item Category,
// Item Sub Category, Item), read from the query string: ?category_id=3&subcategory_id=12&status=1.
// `fields` maps each accepted query parameter to its column; anything empty or not a whole
// number is ignored, so a list without filters behaves as before.
const categoryListFilters = (query, fields) => {
  const where = {};
  Object.entries(fields).forEach(([param, column]) => {
    const value = query[param];
    if (value === undefined || value === null || String(value).trim() === '') return;
    const number = Number(value);
    if (Number.isInteger(number) && number >= 0) where[column] = number;
  });
  return where;
};

module.exports = { categoryListFilters };
