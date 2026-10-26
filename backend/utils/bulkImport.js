// ===== Config =====
// Columns, required flags and aliases must stay in sync with frontend/src/admin/pages/BulkImport.jsx; examples exist only in the frontend config.
const BULK_IMPORT_LEVELS = {
  item_category: {
    label: 'Item Category',
    fileName: 'item_category_sample.xlsx',
    columns: [
      { name: 'Category', required: true, aliases: ['category'] },
      { name: 'Sub Category', required: true, aliases: ['sub category', 'subcategory'] },
      { name: 'Item Category', required: true, aliases: ['item category', 'itemcategory'] },
      { name: 'Status', required: false, aliases: ['status'] },
    ],
  },
  item_sub_category: {
    label: 'Item Sub Category',
    fileName: 'item_sub_category_sample.xlsx',
    columns: [
      { name: 'Category', required: true, aliases: ['category'] },
      { name: 'Sub Category', required: true, aliases: ['sub category', 'subcategory'] },
      { name: 'Item Category', required: true, aliases: ['item category', 'itemcategory'] },
      { name: 'Item Sub Category', required: true, aliases: ['item sub category', 'item subcategory', 'itemsubcategory'] },
      { name: 'Status', required: false, aliases: ['status'] },
    ],
  },
};

const ALLOW_SAME_NAME_ACROSS_PARENTS = false;

const { QueryTypes } = require('sequelize');
const XLSX = require('xlsx-js-style');
const sequelize = require('../config/database');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const ItemCategory = require('../models/ItemCategory');
const ItemSubCategory = require('../models/ItemSubCategory');
const ProductKeyword = require('../models/ProductKeyword');
const { findPreloadedCategoryNameConflict } = require('./categoryNameConflictHelper');
const { syncItemCategoryMainKeyword } = require('./itemCategoryKeywordSync');

// ===== File parsing =====

const MAX_FILE_BYTES = 5 * 1024 * 1024;

class BulkImportInputError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'BulkImportInputError';
    this.statusCode = statusCode;
  }
}

const HEADER_KEY = (value) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const XLSX_MIME_TYPES = new Set([
  '',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream',
  'application/zip',
]);
const CSV_MIME_TYPES = new Set([
  '',
  'text/csv',
  'text/plain',
  'text/x-csv',
  'text/comma-separated-values',
  'application/csv',
  'application/x-csv',
  'application/vnd.ms-excel',
  'application/octet-stream',
]);

const validateCsvQuotes = (text) => {
  let inQuotes = false;
  let fieldStarted = false;
  let afterQuote = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') index += 1;
        else {
          inQuotes = false;
          afterQuote = true;
        }
      }
      continue;
    }
    if (afterQuote) {
      if (character === ',' || character === '\n' || character === '\r') {
        afterQuote = false;
        fieldStarted = false;
      } else if (character !== ' ' && character !== '\t') {
        throw new BulkImportInputError('The CSV file is corrupt because a quoted field is malformed.');
      }
      continue;
    }
    if (character === '"') {
      if (fieldStarted) throw new BulkImportInputError('The CSV file is corrupt because a quoted field is malformed.');
      inQuotes = true;
    } else if (character === ',' || character === '\n' || character === '\r') {
      fieldStarted = false;
    } else {
      fieldStarted = true;
    }
  }
  if (inQuotes) throw new BulkImportInputError('The CSV file is corrupt because a quoted field was not closed.');
};

const getFileWorkbook = (file, extension) => {
  const buffer = file?.buffer;
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new BulkImportInputError('The selected file is empty or could not be read.');
  if (buffer.length > MAX_FILE_BYTES || Number(file.size || 0) > MAX_FILE_BYTES) {
    throw new BulkImportInputError('The file must be 5 MB or smaller.');
  }
  const mime = String(file.mimetype || '').toLowerCase();
  const allowedTypes = extension === '.xlsx' ? XLSX_MIME_TYPES : CSV_MIME_TYPES;
  if (!allowedTypes.has(mime)) throw new BulkImportInputError('The selected file type does not match its extension.');

  if (extension === '.csv') {
    let text;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      throw new BulkImportInputError('CSV file must contain valid UTF-8 text.');
    }
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    if (!text.trim()) throw new BulkImportInputError('The selected file is empty.');
    validateCsvQuotes(text);
    try {
      return XLSX.read(text, { type: 'string', raw: false, cellText: true, cellDates: false });
    } catch {
      throw new BulkImportInputError('The CSV file is corrupt or could not be read.');
    }
  }

  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4B || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
    if (buffer[0] === 0xD0 && buffer[1] === 0xCF) {
      throw new BulkImportInputError('Password-protected or legacy Excel files are not supported. Save the file as an unprotected .xlsx workbook.');
    }
    throw new BulkImportInputError('The .xlsx file is corrupt or is not a valid Excel workbook.');
  }
  try {
    return XLSX.read(buffer, { type: 'buffer', raw: false, cellText: true, cellDates: false, bookVBA: false });
  } catch (error) {
    if (/password|encrypt/i.test(String(error?.message || ''))) {
      throw new BulkImportInputError('Password-protected Excel files are not supported. Remove the password and try again.');
    }
    throw new BulkImportInputError('The .xlsx file is corrupt, password-protected, or could not be read.');
  }
};

const parseBulkImportFile = ({ file, level } = {}) => {
  const definition = BULK_IMPORT_LEVELS[level];
  if (!definition) throw new BulkImportInputError('Invalid level. Use item_category or item_sub_category.');
  if (!file || typeof file.originalname !== 'string') throw new BulkImportInputError('Choose an .xlsx or .csv file to validate.');
  const extension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
  if (!['.xlsx', '.csv'].includes(extension)) throw new BulkImportInputError('Only .xlsx and .csv files are supported.');

  const workbook = getFileWorkbook(file, extension);
  const definitions = Object.values(BULK_IMPORT_LEVELS).flatMap((item) => item.columns);
  const aliasMap = new Map();
  definitions.forEach((column) => {
    [column.name, ...(column.aliases || [])].forEach((alias) => aliasMap.set(HEADER_KEY(alias), column.name));
  });
  const levelColumns = new Set(definition.columns.map((column) => column.name));
  const rows = [];
  const warnings = [];
  let foundValidSheet = false;

  (workbook.SheetNames || []).forEach((sheetName, sheetIndex) => {
    if (String(sheetName).trim().toLowerCase() === 'instructions') return;
    const sheetInfo = workbook.Workbook?.Sheets?.[sheetIndex];
    if (sheetInfo?.Hidden) return;
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet || !worksheet['!ref']) return;
    let matrix;
    try {
      matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '', blankrows: true, range: 0 });
    } catch {
      throw new BulkImportInputError(`Sheet "${sheetName}" is corrupt or could not be read.`);
    }
    if (!matrix.some((row) => row.some((cell) => String(cell ?? '').trim()))) return;

    let headerInfo = null;
    const maxHeaderRows = Math.min(matrix.length, 100);
    for (let rowIndex = 0; rowIndex < maxHeaderRows; rowIndex += 1) {
      const mapping = new Map();
      const extraHeaders = [];
      matrix[rowIndex].forEach((cell, columnIndex) => {
        const text = String(cell ?? '').trim();
        if (!text) return;
        const canonical = aliasMap.get(HEADER_KEY(text));
        if (canonical) mapping.set(canonical, columnIndex);
        else extraHeaders.push(text);
      });
      const matched = [...mapping.keys()].filter((name) => levelColumns.has(name)).length;
      if (!headerInfo || matched > headerInfo.matched) headerInfo = { rowIndex, mapping, extraHeaders, matched };
      if (definition.columns.every((column) => !column.required || mapping.has(column.name))) {
        headerInfo = { rowIndex, mapping, extraHeaders, matched };
        break;
      }
    }

    if (level === 'item_category' && headerInfo?.mapping.has('Item Sub Category')) {
      throw new BulkImportInputError(`Sheet "${sheetName}" contains Item Sub Category rows. Choose the Item Sub Category level instead.`);
    }
    const missing = definition.columns.filter((column) => column.required && !headerInfo?.mapping.has(column.name));
    if (missing.length) {
      if (level === 'item_sub_category' && missing.some((column) => column.name === 'Item Sub Category') && headerInfo?.mapping.has('Item Category')) {
        throw new BulkImportInputError(`Sheet "${sheetName}" appears to be an Item Category file. Choose the Item Category level instead.`);
      }
      throw new BulkImportInputError(`Sheet "${sheetName}" is missing required column(s): ${missing.map((column) => column.name).join(', ')}.`);
    }

    foundValidSheet = true;
    if (headerInfo.extraHeaders.length) {
      warnings.push(`Sheet "${sheetName}": ignored extra column(s): ${[...new Set(headerInfo.extraHeaders)].join(', ')}.`);
    }
    for (let rowIndex = headerInfo.rowIndex + 1; rowIndex < matrix.length; rowIndex += 1) {
      const rawValues = {};
      definition.columns.forEach((column) => {
        const columnIndex = headerInfo.mapping.get(column.name);
        rawValues[column.name] = columnIndex === undefined ? '' : String(matrix[rowIndex]?.[columnIndex] ?? '');
      });
      if (Object.values(rawValues).every((value) => !value.trim())) continue;
      rows.push({ sheet: String(sheetName), rowNumber: rowIndex + 1, rawValues, controlFields: [] });
      if (rows.length > MAX_BULK_IMPORT_ROWS) {
        throw new BulkImportInputError(`File contains more than ${MAX_BULK_IMPORT_ROWS} non-empty data rows.`);
      }
    }
  });

  if (!foundValidSheet) throw new BulkImportInputError('No visible sheet has valid headers for the selected import level.');
  if (!rows.length) throw new BulkImportInputError('No non-empty data rows were found in sheets with valid headers.');
  return { rows, warnings };
};

// ===== Schema =====

const REQUIRED_PRIMARY_KEYS = [
  { table: 'item_category', column: 'item_category_id' },
  { table: 'item_subcategory', column: 'item_subcategory_id' },
  { table: 'product_keywords', column: 'product_keyword_id' },
];

class BulkImportSchemaError extends Error {
  constructor(table) {
    super(`Database table ${table} primary key is not AUTO_INCREMENT. Ask the DBA to fix the schema before importing.`);
    this.name = 'BulkImportSchemaError';
    this.table = table;
  }
}

const assertBulkImportSchema = async () => {
  const definitions = await sequelize.query(
    `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, COLUMN_KEY AS columnKey, EXTRA AS extra
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND ((TABLE_NAME = 'item_category' AND COLUMN_NAME = 'item_category_id')
         OR (TABLE_NAME = 'item_subcategory' AND COLUMN_NAME = 'item_subcategory_id')
         OR (TABLE_NAME = 'product_keywords' AND COLUMN_NAME = 'product_keyword_id'))`,
    { type: QueryTypes.SELECT },
  );
  for (const required of REQUIRED_PRIMARY_KEYS) {
    const column = definitions.find((definition) => definition.tableName === required.table);
    if (!column || column.columnName !== required.column || column.columnKey !== 'PRI' || !/auto_increment/i.test(column.extra || '')) {
      throw new BulkImportSchemaError(required.table);
    }
  }
};

// ===== Validator =====
const normalizeCellText = (value) => String(value ?? '')
  .replace(/\u00a0/g, ' ')
  .normalize('NFC')
  .replace(/[\t\r\n ]+/g, ' ')
  .trim();

const MAX_BULK_IMPORT_ROWS = 2000;
const MAX_BULK_IMPORT_FIELD_LENGTH = 255;

class BulkImportRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BulkImportRequestError';
  }
}

const validateBulkImportPayload = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BulkImportRequestError('Request body must be a JSON object.');
  const { level, rows } = body;
  const definition = BULK_IMPORT_LEVELS[level];
  if (!definition) throw new BulkImportRequestError('Invalid level. Use item_category or item_sub_category.');
  if (!Array.isArray(rows)) throw new BulkImportRequestError('Rows must be an array.');
  if (rows.length === 0) throw new BulkImportRequestError('No rows found to validate.');
  if (rows.length > MAX_BULK_IMPORT_ROWS) throw new BulkImportRequestError(`File contains more than ${MAX_BULK_IMPORT_ROWS} non-empty data rows.`);

  const columns = new Set(definition.columns.map((column) => column.name));
  const normalizedRows = rows.map((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new BulkImportRequestError(`Row ${index + 1} must be an object.`);
    if (typeof row.sheet !== 'string' || !row.sheet.trim()) throw new BulkImportRequestError(`Row ${index + 1} sheet must be a non-empty string.`);
    if (row.sheet.length > MAX_BULK_IMPORT_FIELD_LENGTH) throw new BulkImportRequestError(`Row ${index + 1} sheet exceeds ${MAX_BULK_IMPORT_FIELD_LENGTH} characters.`);
    if (!Number.isSafeInteger(row.rowNumber) || row.rowNumber < 1) throw new BulkImportRequestError(`Row ${index + 1} rowNumber must be a positive integer.`);
    if (!row.values || typeof row.values !== 'object' || Array.isArray(row.values)) throw new BulkImportRequestError(`Row ${index + 1} values must be an object.`);
    for (const key of Object.keys(row.values)) {
      if (!columns.has(key)) throw new BulkImportRequestError(`Row ${index + 1} contains an unsupported column: ${key}.`);
    }
    const values = {};
    for (const column of definition.columns) {
      const value = row.values[column.name] ?? '';
      if (typeof value !== 'string') throw new BulkImportRequestError(`Row ${index + 1} field "${column.name}" must be a string.`);
      if (value.length > MAX_BULK_IMPORT_FIELD_LENGTH) throw new BulkImportRequestError(`Row ${index + 1} field "${column.name}" exceeds ${MAX_BULK_IMPORT_FIELD_LENGTH} characters.`);
      values[column.name] = value;
    }
    return { sheet: row.sheet.trim(), rowNumber: row.rowNumber, rawValues: values };
  });
  return { level, rows: normalizedRows };
};
// ===== Validator =====

const modelNameLimit = (model) => model.rawAttributes.name.type._length
  || model.rawAttributes.name.type.options?.length
  || 255;
const NAME_MAX_LENGTH = Math.min(modelNameLimit(ItemCategory), modelNameLimit(ItemSubCategory));
const comparisonKey = (value) => normalizeCellText(value).toLowerCase();
const hasControlCharacters = (value) => /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/.test(value);

const editDistance = (left, right) => {
  if (Math.abs(left.length - right.length) > 3) return 4;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[right.length];
};

const suggestName = (input, candidates) => {
  const key = comparisonKey(input);
  if (!key) return null;
  let best = null;
  let bestDistance = 4;
  for (const candidate of candidates) {
    const candidateKey = comparisonKey(candidate.name);
    const distance = candidateKey.startsWith(key) || key.startsWith(candidateKey) ? 1 : editDistance(key, candidateKey);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate.name;
    }
  }
  return best;
};

const formatNotFound = (label, value, parentLabel, parentValue, candidates) => {
  const suggestion = suggestName(value, candidates);
  return `${label} "${value}" not found under ${parentLabel} "${parentValue}".${suggestion ? ` Did you mean "${suggestion}"?` : ''}`;
};

const lookupByName = (rows) => {
  const map = new Map();
  rows.forEach((row) => {
    const key = comparisonKey(row.name);
    if (!key) return;
    const current = map.get(key);
    if (!current || (Number(current.status) !== 1 && Number(row.status) === 1)) map.set(key, row);
  });
  return map;
};

const validateStatus = (value) => {
  const normalized = comparisonKey(value);
  if (!normalized || ['active', '1', 'true'].includes(normalized)) return { value: 1 };
  if (['inactive', '0', 'false'].includes(normalized)) return { value: 0 };
  return { error: `Status "${value}" is invalid. Use Active, Inactive, 1, 0, true or false.` };
};

const validateBulkImportRows = async (level, sourceRows, options = {}) => {
  const definition = BULK_IMPORT_LEVELS[level];
  if (!definition) throw new Error('Invalid bulk import level.');

  const [categories, subCategories, itemCategories, itemSubCategories] = options.preloadedData
    ? [options.preloadedData.categories || [], options.preloadedData.subCategories || [], options.preloadedData.itemCategories || [], options.preloadedData.itemSubCategories || []]
    : await Promise.all([
      Categories.findAll({ where: { is_delete: 0 }, attributes: ['id', 'name', 'status'], raw: true, transaction: options.transaction }),
      SubCategories.findAll({ where: { is_delete: 0 }, attributes: ['id', 'name', 'category', 'status'], raw: true, transaction: options.transaction }),
      ItemCategory.findAll({ where: { is_delete: 0 }, attributes: ['id', 'name', 'category_id', 'subcategory_id', 'status'], raw: true, transaction: options.transaction }),
      ItemSubCategory.findAll({ where: { is_delete: 0 }, attributes: ['id', 'name', 'item_category_id', 'category_id', 'subcategory_id', 'status'], raw: true, transaction: options.transaction }),
    ]);

  const availableCategories = categories.filter((row) => Number(row.is_delete || 0) === 0);
  const availableSubCategories = subCategories.filter((row) => Number(row.is_delete || 0) === 0);
  const availableItemCategories = itemCategories.filter((row) => Number(row.is_delete || 0) === 0);
  const availableItemSubCategories = itemSubCategories.filter((row) => Number(row.is_delete || 0) === 0);

  const categoryNames = lookupByName(availableCategories);
  const subCategoriesByParent = new Map();
  const itemCategoriesByParent = new Map();
  const itemSubCategoriesByParent = new Map();
  const addToPathMap = (map, path, row) => {
    if (!map.has(path)) map.set(path, new Map());
    const names = map.get(path);
    const key = comparisonKey(row.name);
    const current = names.get(key);
    if (!current || (Number(current.status) !== 1 && Number(row.status) === 1)) names.set(key, row);
  };

  availableSubCategories.forEach((row) => addToPathMap(subCategoriesByParent, String(row.category), row));
  availableItemCategories.forEach((row) => addToPathMap(itemCategoriesByParent, String(row.subcategory_id), row));
  availableItemSubCategories.forEach((row) => addToPathMap(itemSubCategoriesByParent, String(row.item_category_id), row));

  const conflictEntries = [
    ...availableCategories.map((row) => ({ ...row, module: 'Category', location: 'Category Master' })),
    ...availableSubCategories.map((row) => ({ ...row, module: 'Sub Category', location: `Category '${availableCategories.find((category) => Number(category.id) === Number(row.category))?.name || row.category}'` })),
    ...availableItemCategories.map((row) => ({ ...row, module: 'Item Category', location: `Sub Category '${availableSubCategories.find((subCategory) => Number(subCategory.id) === Number(row.subcategory_id))?.name || row.subcategory_id}'` })),
    ...availableItemSubCategories.map((row) => ({ ...row, module: 'Item Sub Category', location: `Item Category '${availableItemCategories.find((item) => Number(item.id) === Number(row.item_category_id))?.name || row.item_category_id}'` })),
  ];

  const seenInFile = new Map();
  return sourceRows.map(({ sheet, rowNumber, rawValues, controlFields = [] }) => {
    const result = {
      sheet,
      rowNumber,
      rawValues,
      resolvedParentIds: {},
      status: 'create',
      message: '',
    };
    const messages = [];

    definition.columns.forEach((column) => {
      const value = normalizeCellText(rawValues[column.name]);
      rawValues[column.name] = value;
      if (column.required && !value) messages.push(`${column.name} is required.`);
      if (column.name !== 'Status' && Array.from(value).length > NAME_MAX_LENGTH) messages.push(`${column.name} must be ${NAME_MAX_LENGTH} characters or fewer.`);
      if (controlFields.includes(column.name) || hasControlCharacters(value)) messages.push(`${column.name} contains unsupported control characters.`);
    });

    const statusResult = validateStatus(rawValues.Status);
    if (statusResult.error) messages.push(statusResult.error);
    result.statusValue = statusResult.value ?? 1;

    const categoryName = rawValues.Category;
    const subCategoryName = rawValues['Sub Category'];
    const itemCategoryName = rawValues['Item Category'];
    const category = categoryNames.get(comparisonKey(categoryName));
    if (!category) {
      messages.push(`Category "${categoryName}" not found.${suggestName(categoryName, availableCategories) ? ` Did you mean "${suggestName(categoryName, availableCategories)}"?` : ''}`);
    } else {
      result.resolvedParentIds.categoryId = category.id;
      if (Number(category.status) !== 1) messages.push(`Category "${category.name}" is inactive.`);
    }

    let subCategory = null;
    if (category) {
      const candidates = subCategoriesByParent.get(String(category.id));
      subCategory = candidates?.get(comparisonKey(subCategoryName));
      if (!subCategory) messages.push(formatNotFound('Sub Category', subCategoryName, 'Category', category.name, candidates ? [...candidates.values()] : []));
      else {
        result.resolvedParentIds.subCategoryId = subCategory.id;
        if (Number(subCategory.status) !== 1) messages.push(`Sub Category "${subCategory.name}" is inactive.`);
      }
    }

    let itemCategory = null;
    if (subCategory && level === 'item_sub_category') {
      const candidates = itemCategoriesByParent.get(String(subCategory.id));
      itemCategory = candidates?.get(comparisonKey(itemCategoryName));
      if (!itemCategory) messages.push(formatNotFound('Item Category', itemCategoryName, 'Sub Category', subCategory.name, candidates ? [...candidates.values()] : []));
      else {
        result.resolvedParentIds.itemCategoryId = itemCategory.id;
        if (Number(itemCategory.status) !== 1) messages.push(`Item Category "${itemCategory.name}" is inactive.`);
      }
    }

    if (!messages.length) {
      const importedName = level === 'item_category' ? itemCategoryName : rawValues['Item Sub Category'];
      const parentId = level === 'item_category' ? subCategory.id : itemCategory.id;
      const importedKey = comparisonKey(importedName);
      const previous = seenInFile.get(importedKey);
      if (previous && previous.parentId === parentId) {
        result.status = 'duplicate_in_file';
        result.message = `Duplicate in file under this parent; the first matching row will be kept.`;
      } else {
        if (!previous) seenInFile.set(importedKey, { parentId, rowNumber });
        let existing;
        if (level === 'item_category') {
          existing = itemCategoriesByParent.get(String(subCategory.id))?.get(comparisonKey(importedName));
        } else {
          existing = itemSubCategoriesByParent.get(String(itemCategory.id))?.get(comparisonKey(importedName));
        }
        if (existing) {
          result.status = Number(existing.status) === 1 ? 'exists' : 'exists_inactive';
          result.message = result.status === 'exists' ? 'Already exists under this parent; it will be skipped.' : 'Already exists under this parent and is inactive; it will be skipped.';
          result.existingId = existing.id;
        }
        if (!(options.allowSameNameAcrossParents ?? ALLOW_SAME_NAME_ACROSS_PARENTS)) {
          const expectedModule = level === 'item_category' ? 'Item Category' : 'Item Sub Category';
          const expectedId = existing?.id;
          const conflict = findPreloadedCategoryNameConflict(importedName, conflictEntries, expectedId ? { module: expectedModule, id: expectedId } : null);
          if ((previous && previous.parentId !== parentId) || conflict) {
            const detail = conflict ? `Name already used by ${conflict.module} '${conflict.name}' under ${conflict.location}.` : 'This name was already used earlier in the file under a different parent.';
            result.status = 'name_conflict';
            result.message = detail;
            delete result.existingId;
          }
        }
      }
    }

    if (messages.length) {
      result.status = 'error';
      result.message = [...new Set(messages)].join(' ');
    }
    return result;
  });
};

const countBulkImportRows = (rows) => rows.reduce((counts, row) => {
  counts.total += 1;
  if (row.status === 'create') counts.create += 1;
  else if (row.status === 'exists') counts.exists += 1;
  else if (row.status === 'exists_inactive') counts.existsInactive += 1;
  else if (row.status === 'duplicate_in_file') counts.duplicateInFile += 1;
  else if (row.status === 'name_conflict') counts.nameConflict += 1;
  else counts.error += 1;
  return counts;
}, { total: 0, create: 0, exists: 0, existsInactive: 0, duplicateInFile: 0, nameConflict: 0, error: 0 });

// ===== Writer =====

const createBulkImportRow = async (level, row, {
  transaction,
  existingKeywordNames = new Set(),
  createdKeywordNames = new Set(),
  onWrite,
} = {}) => {
  const values = row.rawValues;
  let record;
  let keywordSkipped = false;
  if (level === 'item_category') {
    onWrite?.('item_category');
    record = await ItemCategory.create({
      name: values['Item Category'],
      category_id: row.resolvedParentIds.categoryId,
      subcategory_id: row.resolvedParentIds.subCategoryId,
      status: row.statusValue,
      file_id: null,
    }, { transaction });
    try {
      await syncItemCategoryMainKeyword(record, { transaction, ensureSchema: false });
    } catch (error) {
      error.bulkImportStage = 'keyword_sync';
      throw error;
    }
  } else {
    onWrite?.('item_sub_category');
    record = await ItemSubCategory.create({
      name: values['Item Sub Category'],
      category_id: row.resolvedParentIds.categoryId,
      subcategory_id: row.resolvedParentIds.subCategoryId,
      item_category_id: row.resolvedParentIds.itemCategoryId,
      status: row.statusValue,
      file_id: null,
    }, { transaction });
    const keywordKey = comparisonKey(record.name);
    if (!existingKeywordNames.has(keywordKey) && !createdKeywordNames.has(keywordKey)) {
      onWrite?.('keyword_sync');
      try {
        await ProductKeyword.create({
          name: record.name,
          item_subcategory_id: record.id,
          status: Number(record.status) === 0 ? 0 : 1,
          is_main: 1,
        }, { transaction, fields: ['name', 'item_subcategory_id', 'status', 'is_main'] });
      } catch (error) {
        error.bulkImportStage = 'keyword_sync';
        throw error;
      }
      createdKeywordNames.add(keywordKey);
    } else keywordSkipped = true;
  }
  return { record, keywordSkipped };
};

const getSqlCode = (error) => error?.original?.code || error?.parent?.code || error?.original?.errno || error?.parent?.errno || error?.code || null;
const getErrorField = (error) => error?.errors?.[0]?.path
  || Object.keys(error?.fields || {})[0]
  || (String(error?.original?.sqlMessage || error?.parent?.sqlMessage || '').includes("key 'PRIMARY'") ? 'PRIMARY' : null);

const classifyBulkImportError = (error) => {
  const name = String(error?.name || '');
  const sqlCode = getSqlCode(error);
  const stack = String(error?.stack || '');
  if (name.includes('UniqueConstraint') || ['ER_DUP_ENTRY', 'SQLITE_CONSTRAINT_UNIQUE'].includes(sqlCode)) {
    if (getErrorField(error) === 'PRIMARY') {
      return { errorCode: 'DB_DUPLICATE_ENTRY', message: 'The database could not allocate a unique record ID. Contact an administrator.' };
    }
    return { errorCode: 'DB_DUPLICATE_ENTRY', message: 'A record with this name already exists. Review the name and validate the file again.' };
  }
  if (name.includes('ForeignKeyConstraint') || ['ER_NO_REFERENCED_ROW_2', 'ER_ROW_IS_REFERENCED_2', 'SQLITE_CONSTRAINT_FOREIGNKEY'].includes(sqlCode)) {
    return { errorCode: 'DB_FOREIGN_KEY', message: 'A required parent record is no longer available. Validate the file again.' };
  }
  if (error?.bulkImportStage === 'keyword_sync') {
    return { errorCode: 'KEYWORD_SYNC', message: 'The category was not imported because its keyword could not be saved. Contact an administrator.' };
  }
  if (stack.includes('/categorySlug.js') || stack.includes('\\categorySlug.js')) {
    return { errorCode: 'SLUG_GENERATION', message: 'A unique URL name could not be generated for this row. Review the name and validate again.' };
  }
  if (name.includes('Validation')) {
    return { errorCode: 'DB_VALIDATION', message: 'This row contains a value that cannot be saved. Review the row and validate again.' };
  }
  if (name.includes('Database')) {
    return { errorCode: 'DB_VALIDATION', message: 'The database could not save this row. Review the row and validate again.' };
  }
  return { errorCode: 'UNKNOWN', message: 'This row could not be imported. Review it and validate the file again.' };
};

const getFailureRow = (row) => {
  if (!row) return null;
  const columns = Object.keys(row.rawValues || {});
  const nameColumn = columns.find((column) => /^item (category|sub category)$/i.test(column)) || columns[columns.length - 1];
  return {
    sheet: row.sheet || null,
    rowNumber: row.rowNumber || null,
    name: nameColumn ? String(row.rawValues?.[nameColumn] ?? '').slice(0, 255) : null,
  };
};

// ===== Stored job data =====

class BulkImportJobDataError extends Error {
  constructor(field, detail) {
    super(`Stored bulk import ${field} is invalid${detail ? `: ${detail}` : '.'}`);
    this.name = 'BulkImportJobDataError';
    this.field = field;
  }
}

const parseStoredJobValue = (value, field) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new BulkImportJobDataError(field, 'could not be parsed as JSON');
  }
};

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const readBulkImportJobCounts = (value) => {
  const counts = parseStoredJobValue(value, 'counts');
  if (!isRecord(counts)) throw new BulkImportJobDataError('counts', 'expected an object');
  for (const field of ['total', 'create', 'exists', 'existsInactive', 'duplicateInFile', 'nameConflict', 'error']) {
    if (counts[field] !== undefined && (typeof counts[field] !== 'number' || !Number.isFinite(counts[field]) || counts[field] < 0)) {
      throw new BulkImportJobDataError('counts', `"${field}" must be a non-negative number`);
    }
  }
  if (counts.commitResult !== undefined && !isRecord(counts.commitResult)) {
    throw new BulkImportJobDataError('counts', '"commitResult" must be an object');
  }
  return counts;
};

const readBulkImportJobRows = (value) => {
  const rows = parseStoredJobValue(value, 'validatedRows');
  if (!Array.isArray(rows)) throw new BulkImportJobDataError('validatedRows', 'expected an array');
  const allowedStatuses = new Set(['create', 'exists', 'exists_inactive', 'duplicate_in_file', 'name_conflict', 'error']);
  rows.forEach((row, index) => {
    if (!isRecord(row)) throw new BulkImportJobDataError('validatedRows', `row ${index + 1} must be an object`);
    if (typeof row.sheet !== 'string' || !row.sheet.trim()) throw new BulkImportJobDataError('validatedRows', `row ${index + 1} has no sheet name`);
    if (!Number.isSafeInteger(row.rowNumber) || row.rowNumber < 1) throw new BulkImportJobDataError('validatedRows', `row ${index + 1} has an invalid row number`);
    if (!isRecord(row.rawValues)) throw new BulkImportJobDataError('validatedRows', `row ${index + 1} rawValues must be an object`);
    if (!allowedStatuses.has(row.status)) throw new BulkImportJobDataError('validatedRows', `row ${index + 1} has an invalid status`);
  });
  return rows;
};

const readBulkImportJobData = (job) => {
  if (!isRecord(job)) throw new BulkImportJobDataError('record', 'expected a job object');
  return {
    counts: readBulkImportJobCounts(job.counts),
    validatedRows: readBulkImportJobRows(job.validatedRows),
  };
};

// ===== Report generation =====

const escapeReportCell = (value) => {
  const text = String(value ?? '');
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
};

const createBulkImportReport = (job) => {
  if (!BULK_IMPORT_LEVELS[job?.level]) throw new BulkImportJobDataError('level', 'unknown import level');
  const { validatedRows, counts } = readBulkImportJobData(job);
  const definition = BULK_IMPORT_LEVELS[job.level];
  const hasCommitResult = ['committed', 'failed'].includes(job.status);
  const headers = ['Sheet', 'Row', ...definition.columns.map((column) => column.name), 'Status', ...(hasCommitResult ? ['Commit Outcome', 'Failure Reason'] : []), 'Message'];
  const reportRows = validatedRows
    .filter((row) => row.status !== 'create' || (job.status === 'failed' && row.commitStatus !== 'created'))
    .map((row) => {
      const values = [row.sheet, row.rowNumber, ...definition.columns.map((column) => row.rawValues[column.name] ?? ''), row.status];
      if (hasCommitResult) {
        const commitResult = counts.commitResult || {};
        const failureReason = row.commitStatus === 'failed'
          ? (row.commitMessage || commitResult.errorMessage || '')
          : '';
        values.push(row.commitStatus || 'Not imported', failureReason);
      }
      values.push(row.commitMessage || row.message || '');
      return values;
    });

  const workbook = XLSX.utils.book_new();
  const data = reportRows.length
    ? [headers, ...reportRows.map((row) => row.map((value) => (typeof value === 'number' ? value : escapeReportCell(value))))]
    : [headers, ['No non-create rows to report.']];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Report');
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
};

module.exports = {
  assertBulkImportSchema,
  BulkImportSchemaError,
  REQUIRED_PRIMARY_KEYS,
  MAX_FILE_BYTES,
  MAX_BULK_IMPORT_ROWS,
  MAX_BULK_IMPORT_FIELD_LENGTH,
  BulkImportInputError,
  parseBulkImportFile,
  createBulkImportReport,
  readBulkImportJobData,
  readBulkImportJobRows,
  readBulkImportJobCounts,
  BulkImportJobDataError,
  BulkImportRequestError,
  validateBulkImportPayload,
  validateBulkImportRows,
  countBulkImportRows,
  comparisonKey,
  validateStatus,
  suggestName,
  createBulkImportRow,
  classifyBulkImportError,
  getSqlCode,
  getErrorField,
  getFailureRow,
  BULK_IMPORT_LEVELS,
  ALLOW_SAME_NAME_ACROSS_PARENTS,
};
