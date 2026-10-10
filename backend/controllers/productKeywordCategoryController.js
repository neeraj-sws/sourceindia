const { Op, fn, col, literal } = require('sequelize');
const ProductKeyword = require('../models/ProductKeyword');
const ProductKeywordCategory = require('../models/ProductKeywordCategory');
const ItemCategory = require('../models/ItemCategory');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const Products = require('../models/Products');
const UploadImage = require('../models/UploadImage');
const sequelize = require('../config/database');
const { withProductUsage, keywordUsageConflict } = require('../utils/keywordProductUsage');
const { categoryListFilters } = require('../utils/categoryListFilter');
const {
  ensureKeywordItemCategoryColumn,
  syncItemCategoryMainKeyword,
} = require('../utils/itemCategoryKeywordSync');

// Product Keyword Category = Product Keywords, but each keyword belongs to an Item Category.
// Rows live in product_keywords with item_subcategory_id = 0 and item_category_id set,
// so the Item Sub Category keywords (item_subcategory_id > 0) are never touched here.
const OWN_ROWS = { item_subcategory_id: 0, item_category_id: { [Op.gt]: 0 } };

exports.ensureSchema = ensureKeywordItemCategoryColumn;

const normalizeKeywordName = (name) => (name || '').toString().trim().toLowerCase();

const isUniqueConstraintError = (error) => (
  error?.name === 'SequelizeUniqueConstraintError'
  || error?.parent?.code === 'ER_DUP_ENTRY'
  || error?.parent?.code === '23505'
);

// Keyword names are unique across the whole product_keywords table, both pages included;
// TRIM because some older names carry leading spaces.
const findExistingNames = async (normalizedNames, excludeId = null) => ProductKeyword.findAll({
  where: {
    ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
    [Op.and]: [sequelize.where(fn('LOWER', fn('TRIM', col('name'))), { [Op.in]: normalizedNames })],
  },
  attributes: ['id', 'name'],
});

const toItemCategoryId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

exports.createKeyword = async (req, res) => {
  try {
    const inputNames = Array.isArray(req.body.names) ? req.body.names : [req.body.name];
    const sanitizedNames = inputNames.map((name) => (name || '').toString().trim()).filter(Boolean);
    const itemCategoryId = toItemCategoryId(req.body.item_category_id);
    const status = req.body.status === undefined ? 1 : Number(req.body.status);

    if (sanitizedNames.length === 0) {
      return res.status(400).json({ message: 'At least one name is required.' });
    }
    if (!itemCategoryId) {
      return res.status(400).json({ message: 'item_category_id is required.' });
    }
    if (![0, 1].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use 1 or 0.' });
    }
    if (!(await ItemCategory.findByPk(itemCategoryId, { attributes: ['id'] }))) {
      return res.status(404).json({ message: 'Item Category not found.' });
    }

    const normalizedNames = sanitizedNames.map(normalizeKeywordName);
    if (new Set(normalizedNames).size !== normalizedNames.length) {
      return res.status(409).json({ message: 'Duplicate names found in request.' });
    }

    const existingKeywords = await findExistingNames(normalizedNames);
    if (existingKeywords.length > 0) {
      return res.status(409).json({
        message: 'Keyword name must be unique.',
        duplicates: existingKeywords.map((k) => k.name),
      });
    }

    const createdKeywords = await ProductKeywordCategory.bulkCreate(sanitizedNames.map((name) => ({
      name,
      item_subcategory_id: 0,
      item_category_id: itemCategoryId,
      status,
    })));
    const createdRows = createdKeywords.map((keyword) => keyword.toJSON());

    res.status(201).json({
      message: createdRows.length > 1 ? 'Product keywords created' : 'Product keyword created',
      keywords: createdRows,
      keyword: createdRows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.importKeywords = async (req, res) => {
  try {
    const rawKeywords = Array.isArray(req.body.keywords)
      ? req.body.keywords
      : Array.isArray(req.body.items) ? req.body.items : [];
    const itemCategoryId = toItemCategoryId(req.body.item_category_id);

    if (!itemCategoryId) {
      return res.status(400).json({ message: 'item_category_id is required for import.' });
    }
    if (!(await ItemCategory.findByPk(itemCategoryId, { attributes: ['id'] }))) {
      return res.status(404).json({ message: 'Item Category not found.' });
    }

    const validationErrors = [];
    const seenInFile = new Map();
    const payloadSeed = [];

    rawKeywords.forEach((row, index) => {
      const rowNumber = index + 1;
      const name = (row?.name || row?.Name || row?.keyword || row?.Keyword || '').toString().trim();
      const status = row?.status === undefined || row?.status === null
        ? Number(row?.Status ?? 1)
        : Number(row.status);

      if (!name) {
        validationErrors.push({ row: rowNumber, name: null, reason: 'Invalid row data. Name is required.' });
        return;
      }

      const normalizedName = normalizeKeywordName(name);
      if (seenInFile.has(normalizedName)) {
        validationErrors.push({
          row: rowNumber,
          name,
          reason: `Duplicate in import file (same as row ${seenInFile.get(normalizedName)}).`,
        });
        return;
      }

      seenInFile.set(normalizedName, rowNumber);
      payloadSeed.push({ rowNumber, name, normalizedName, status: [0, 1].includes(status) ? status : 1 });
    });

    if (payloadSeed.length === 0) {
      return res.status(400).json({
        message: 'No valid keywords found to import.',
        importedCount: 0,
        errors: validationErrors,
      });
    }

    const existingNameSet = new Set(
      (await findExistingNames(payloadSeed.map((row) => row.normalizedName)))
        .map((keyword) => normalizeKeywordName(keyword.name))
    );

    const duplicateErrors = [];
    const rowsToImport = payloadSeed.filter((row) => {
      if (existingNameSet.has(row.normalizedName)) {
        duplicateErrors.push({ row: row.rowNumber, name: row.name, reason: 'Keyword already exists.' });
        return false;
      }
      return true;
    });

    const importErrors = [...validationErrors, ...duplicateErrors];
    const createdKeywords = [];

    for (const row of rowsToImport) {
      try {
        createdKeywords.push(await ProductKeywordCategory.create({
          name: row.name,
          item_subcategory_id: 0,
          item_category_id: itemCategoryId,
          status: row.status,
        }));
      } catch (createError) {
        if (isUniqueConstraintError(createError)) {
          importErrors.push({ row: row.rowNumber, name: row.name, reason: 'Keyword already exists.' });
          continue;
        }
        throw createError;
      }
    }

    const duplicates = importErrors
      .filter((entry) => entry.reason === 'Keyword already exists.')
      .map((entry) => entry.name);

    if (createdKeywords.length === 0) {
      return res.status(409).json({
        message: 'No keywords were imported due to duplicate/invalid rows.',
        importedCount: 0,
        duplicates,
        errors: importErrors,
      });
    }

    res.status(201).json({
      message: `${createdKeywords.length} keyword(s) imported successfully.${importErrors.length ? ` ${importErrors.length} row(s) skipped.` : ''}`,
      importedCount: createdKeywords.length,
      skippedCount: importErrors.length,
      duplicates,
      errors: importErrors,
      keywords: createdKeywords.map((keyword) => keyword.toJSON()),
    });
  } catch (err) {
    console.error('Error importing keywords:', err);
    res.status(500).json({ error: err.message });
  }
};

const itemCategoryIncludes = [
  { model: Categories, as: 'Categories', attributes: ['id', 'name'] },
  { model: SubCategories, as: 'SubCategories', attributes: ['id', 'name'] },
];

// All Item Categories (used for the keyword list title and the "unused" view).
exports.getAllItemCategories = async (req, res) => {
  try {
    const where = { is_delete: 0 };
    if (req.query.excludeItemCategories === 'true') {
      where.id = {
        [Op.notIn]: literal(`(
          SELECT DISTINCT item_category_id
          FROM products
          WHERE item_category_id IS NOT NULL
        )`)
      };
    }

    const itemCategories = await ItemCategory.findAll({
      where,
      order: [['id', 'ASC']],
      include: itemCategoryIncludes,
    });

    res.json(itemCategories.map((row) => {
      const data = row.toJSON();
      return {
        ...data,
        getStatus: data.status === 1 ? 'Active' : 'Inactive',
        category_name: data.Categories?.name || null,
        subcategory_name: data.SubCategories?.name || null,
        Categories: undefined,
        SubCategories: undefined,
      };
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllItemCategoriesServerSide = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'id', sort = 'DESC' } = req.query;
    const validColumns = ['id', 'name', 'created_at', 'updated_at'];
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitValue = parseInt(limit, 10);

    let order;
    if (sortBy === 'subcategory_name') {
      order = [[{ model: SubCategories, as: 'SubCategories' }, 'name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }

    const where = { is_delete: 0 };
    if (req.query.excludeItemCategories === 'true') {
      where.id = {
        [Op.notIn]: literal(`(
          SELECT DISTINCT item_category_id
          FROM products
          WHERE item_category_id IS NOT NULL
        )`)
      };
    }
    // List filters (Filter panel of the admin list); the total above the list stays unfiltered.
    const searchWhere = { ...where, ...categoryListFilters(req.query, { category_id: 'category_id', subcategory_id: 'subcategory_id', status: 'status' }) };
    if (search) {
      searchWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { '$SubCategories.name$': { [Op.like]: `%${search}%` } },
        // Also by the keywords inside the row (the "Keywords" popup), e.g. a keyword added by hand.
        {
          id: {
            [Op.in]: literal(`(
              SELECT item_category_id FROM product_keywords
              WHERE item_subcategory_id = 0 AND item_category_id > 0
                AND name LIKE ${sequelize.escape(`%${search}%`)}
            )`),
          },
        },
      ];
    }

    const totalRecords = await ItemCategory.count({ where });
    const { count: filteredRecords, rows } = await ItemCategory.findAndCountAll({
      where: searchWhere,
      order,
      limit: limitValue,
      offset,
      distinct: true,
      attributes: ['id', 'name', 'category_id', 'subcategory_id', 'file_id', 'status', 'created_at', 'updated_at'],
      include: [
        { model: SubCategories, as: 'SubCategories', attributes: ['id', 'name'], required: false },
        { model: UploadImage, attributes: ['file'], required: false },
      ],
    });

    res.json({
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status,
        is_parent: true,
        item_category_id: row.id,
        item_category_name: row.name,
        subcategory_name: row.SubCategories?.name || null,
        file_name: row.UploadImage?.file || null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      totalRecords,
      filteredRecords,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getItemCategoryCount = async (req, res) => {
  try {
    const total = await ItemCategory.count({ where: { is_delete: 0 } });
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getKeywordsByItemCategoryId = async (req, res) => {
  try {
    const itemCategoryId = toItemCategoryId(req.params.id);
    if (!itemCategoryId) {
      return res.status(400).json({ message: 'Invalid item_category_id' });
    }

    const itemCategory = await ItemCategory.findByPk(itemCategoryId, { attributes: ['id', 'name', 'status'] });
    if (!itemCategory) return res.status(404).json({ message: 'Item Category not found' });
    await syncItemCategoryMainKeyword(itemCategory);

    const keywords = await ProductKeywordCategory.findAll({
      where: { ...OWN_ROWS, item_category_id: itemCategoryId },
      attributes: ['id', 'name', 'status', 'is_main', 'created_at', 'updated_at'],
      order: [['is_main', 'DESC'], ['id', 'ASC']],
      raw: true,
    });

    res.json(await withProductUsage(keywords));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateKeyword = async (req, res) => {
  try {
    const keyword = await ProductKeywordCategory.findOne({
      where: { ...OWN_ROWS, id: req.params.id },
      attributes: ['id', 'name', 'status', 'is_main', 'updated_at'],
    });

    if (!keyword) return res.status(404).json({ message: 'Keyword not found' });
    if (Number(keyword.is_main) === 1) {
      return res.status(403).json({ message: 'This keyword is managed by Item Category and cannot be edited here.' });
    }
    const usageConflict = await keywordUsageConflict([keyword], 'edited');
    if (usageConflict) return res.status(409).json({ message: usageConflict });
    const name = (req.body.name || '').toString().trim();
    if (!name) return res.status(400).json({ message: 'Name is required.' });

    const duplicate = await findExistingNames([normalizeKeywordName(name)], keyword.id);
    if (duplicate.length > 0) {
      return res.status(409).json({ message: 'Keyword name must be unique.' });
    }

    keyword.name = name;
    if (req.body.status !== undefined) keyword.status = Number(req.body.status);
    await keyword.save({ fields: ['name', 'status', 'updated_at'] });
    res.json({ message: 'Keyword updated', keyword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteKeyword = async (req, res) => {
  try {
    const keyword = await ProductKeywordCategory.findOne({
      where: { ...OWN_ROWS, id: req.params.id },
      attributes: ['id', 'item_category_id', 'is_main'],
    });
    if (!keyword) return res.status(404).json({ message: 'Keyword not found' });
    if (Number(keyword.is_main) === 1) {
      return res.status(403).json({ message: 'This keyword is managed by Item Category and cannot be deleted here.' });
    }
    const usageConflict = await keywordUsageConflict([keyword], 'deleted');
    if (usageConflict) return res.status(409).json({ message: usageConflict });
    await keyword.destroy();
    res.json({ message: 'Keyword deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedKeywords = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to delete.' });
    }

    const keywords = await ProductKeywordCategory.findAll({
      where: { ...OWN_ROWS, id: { [Op.in]: ids.map((id) => parseInt(id, 10)) } },
      attributes: ['id', 'item_category_id', 'is_main'],
    });
    if (keywords.length === 0) {
      return res.status(404).json({ message: 'No Product Keywords found with the given IDs.' });
    }

    const deletable = keywords.filter((keyword) => Number(keyword.is_main) !== 1);
    const usageConflict = deletable.length ? await keywordUsageConflict(deletable, 'deleted') : null;
    if (usageConflict) return res.status(409).json({ message: usageConflict });

    const deletableIds = deletable.map((keyword) => keyword.id);
    if (deletableIds.length) {
      await ProductKeywordCategory.destroy({
        where: { ...OWN_ROWS, id: { [Op.in]: deletableIds }, is_main: { [Op.ne]: 1 } },
      });
    }

    const skippedCount = keywords.length - deletableIds.length;
    res.json({
      message: `${deletableIds.length} Product Keyword(s) deleted.${skippedCount ? ` ${skippedCount} main keyword(s) skipped.` : ''}`,
      deletedIds: deletableIds,
      skippedCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateItemCategoryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }

    const itemCategory = await ItemCategory.findByPk(req.params.id);
    if (!itemCategory) return res.status(404).json({ message: 'Item Category not found' });

    itemCategory.status = status;
    await itemCategory.save();

    res.json({ message: 'Status updated', itemCategory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
