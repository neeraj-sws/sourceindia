const { Op } = require('sequelize');
const sequelize = require('../config/database');
const ItemCategory = require('../models/ItemCategory');
const ItemCategoryField = require('../models/ItemCategoryField');
const ItemCategoryFieldOption = require('../models/ItemCategoryFieldOption');

const OPTION_TYPES = ['radio', 'checkbox', 'select', 'multiselect'];

const capitalizeFirst = (value) => {
    const txt = (value || '').toString().trim();
    if (!txt) return '';
    return txt.charAt(0).toUpperCase() + txt.slice(1);
};

const toFlag = (value, defaultValue = 0) => {
    if (value === undefined || value === null || value === '') return defaultValue;
    return Number(value) === 1 || value === true || value === 'true' ? 1 : 0;
};

const toNullableInt = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const toNullableDecimal = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const mapField = (field) => ({
    id: field.id,
    uuid: field.uuid,
    item_category_id: field.item_category_id,
    label: field.field_label,
    key: field.field_key,
    inputType: field.input_type,
    required: Number(field.required) === 1,
    placeholder: field.placeholder || '',
    defaultValue: field.default_value || '',
    helpText: field.help_text || '',
    displayOrder: field.display_order,
    isActive: Number(field.is_active) === 1,
    validation: {
        minLength: field.min_length,
        maxLength: field.max_length,
        minValue: field.min_value,
        maxValue: field.max_value,
        regexPattern: field.regex_pattern || '',
    },
    settings: {
        searchable: Number(field.is_searchable) === 1,
        filterable: Number(field.is_filterable) === 1,
        showOnProductDetail: Number(field.show_on_detail) === 1,
        showOnProductListing: Number(field.show_on_listing) === 1,
        allowEditAfterProductCreation: Number(field.allow_edit_after_create) === 1,
    },
    options: (field.options || [])
        .filter((option) => Number(option.is_delete) === 0)
        .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
        .map((option) => ({
            id: option.id,
            uuid: option.uuid,
            label: capitalizeFirst(option.option_label),
            value: option.option_value,
            sortOrder: option.sort_order,
            isActive: Number(option.is_active) === 1,
        })),
});

const ensureUniqueFieldKey = async (itemCategoryId, fieldKey, excludeId = null, transaction = null) => {
    const where = {
        item_category_id: itemCategoryId,
        field_key: fieldKey,
        is_delete: 0,
    };

    if (excludeId) {
        where.id = { [Op.ne]: excludeId };
    }

    const existing = await ItemCategoryField.findOne({ where, transaction });
    return !existing;
};

exports.getFieldsByItemCategory = async (req, res) => {
    try {
        const { itemCategoryId } = req.params;

        const fields = await ItemCategoryField.findAll({
            where: {
                item_category_id: itemCategoryId,
                is_delete: 0,
            },
            include: [
                {
                    model: ItemCategoryFieldOption,
                    as: 'options',
                    required: false,
                },
            ],
            order: [
                ['display_order', 'ASC'],
                [{ model: ItemCategoryFieldOption, as: 'options' }, 'sort_order', 'ASC'],
            ],
        });

        return res.json(fields.map(mapField));
    } catch (error) {
        console.error('Error loading item category fields:', error);
        return res.status(500).json({ error: error.message });
    }
};

exports.createField = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const {
            item_category_id,
            label,
            key,
            inputType,
            required,
            placeholder,
            defaultValue,
            helpText,
            displayOrder,
            isActive,
            validation,
            settings,
            options,
        } = req.body;

        if (!item_category_id || !label || !key || !inputType) {
            await transaction.rollback();
            return res.status(400).json({ message: 'item_category_id, label, key and inputType are required' });
        }

        const itemCategory = await ItemCategory.findByPk(item_category_id, { transaction });
        if (!itemCategory || Number(itemCategory.is_delete) === 1) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Item category not found' });
        }

        const isUnique = await ensureUniqueFieldKey(item_category_id, key, null, transaction);
        if (!isUnique) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Field key already exists for this item category' });
        }

        let resolvedDisplayOrder = toNullableInt(displayOrder);
        if (!resolvedDisplayOrder) {
            const maxOrder = await ItemCategoryField.max('display_order', {
                where: { item_category_id, is_delete: 0 },
                transaction,
            });
            resolvedDisplayOrder = (Number(maxOrder) || 0) + 1;
        }

        const field = await ItemCategoryField.create({
            item_category_id,
            field_label: label,
            field_key: key,
            input_type: inputType,
            required: toFlag(required, 0),
            placeholder: placeholder || null,
            default_value: defaultValue || null,
            help_text: helpText || null,
            display_order: resolvedDisplayOrder,
            is_active: toFlag(isActive, 1),
            min_length: toNullableInt(validation?.minLength),
            max_length: toNullableInt(validation?.maxLength),
            min_value: toNullableDecimal(validation?.minValue),
            max_value: toNullableDecimal(validation?.maxValue),
            regex_pattern: validation?.regexPattern || null,
            is_searchable: toFlag(settings?.searchable, 0),
            is_filterable: toFlag(settings?.filterable, 0),
            show_on_detail: toFlag(settings?.showOnProductDetail, 1),
            show_on_listing: toFlag(settings?.showOnProductListing, 0),
            allow_edit_after_create: toFlag(settings?.allowEditAfterProductCreation, 1),
        }, { transaction });

        if (OPTION_TYPES.includes(String(inputType).toLowerCase()) && Array.isArray(options) && options.length > 0) {
            const optionRows = options
                .filter((opt) => opt?.label && opt?.value)
                .map((opt, index) => ({
                    item_category_field_id: field.id,
                    option_label: capitalizeFirst(opt.label),
                    option_value: opt.value,
                    sort_order: toNullableInt(opt.sortOrder) || index + 1,
                    is_active: toFlag(opt.isActive, 1),
                }));

            if (optionRows.length > 0) {
                await ItemCategoryFieldOption.bulkCreate(optionRows, { transaction });
            }
        }

        const created = await ItemCategoryField.findByPk(field.id, {
            include: [{ model: ItemCategoryFieldOption, as: 'options', required: false }],
            transaction,
        });

        await transaction.commit();
        return res.status(201).json({ message: 'Field created successfully', data: mapField(created) });
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating item category field:', error);
        return res.status(500).json({ error: error.message });
    }
};

exports.updateField = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const {
            label,
            key,
            inputType,
            required,
            placeholder,
            defaultValue,
            helpText,
            displayOrder,
            isActive,
            validation,
            settings,
            options,
        } = req.body;

        const field = await ItemCategoryField.findOne({ where: { id, is_delete: 0 }, transaction });
        if (!field) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Field not found' });
        }

        if (key && key !== field.field_key) {
            const isUnique = await ensureUniqueFieldKey(field.item_category_id, key, id, transaction);
            if (!isUnique) {
                await transaction.rollback();
                return res.status(400).json({ message: 'Field key already exists for this item category' });
            }
        }

        await field.update({
            field_label: label ?? field.field_label,
            field_key: key ?? field.field_key,
            input_type: inputType ?? field.input_type,
            required: required === undefined ? field.required : toFlag(required, 0),
            placeholder: placeholder === undefined ? field.placeholder : (placeholder || null),
            default_value: defaultValue === undefined ? field.default_value : (defaultValue || null),
            help_text: helpText === undefined ? field.help_text : (helpText || null),
            display_order: displayOrder === undefined ? field.display_order : (toNullableInt(displayOrder) || field.display_order),
            is_active: isActive === undefined ? field.is_active : toFlag(isActive, 1),
            min_length: validation?.minLength === undefined ? field.min_length : toNullableInt(validation?.minLength),
            max_length: validation?.maxLength === undefined ? field.max_length : toNullableInt(validation?.maxLength),
            min_value: validation?.minValue === undefined ? field.min_value : toNullableDecimal(validation?.minValue),
            max_value: validation?.maxValue === undefined ? field.max_value : toNullableDecimal(validation?.maxValue),
            regex_pattern: validation?.regexPattern === undefined ? field.regex_pattern : (validation?.regexPattern || null),
            is_searchable: settings?.searchable === undefined ? field.is_searchable : toFlag(settings?.searchable, 0),
            is_filterable: settings?.filterable === undefined ? field.is_filterable : toFlag(settings?.filterable, 0),
            show_on_detail: settings?.showOnProductDetail === undefined ? field.show_on_detail : toFlag(settings?.showOnProductDetail, 1),
            show_on_listing: settings?.showOnProductListing === undefined ? field.show_on_listing : toFlag(settings?.showOnProductListing, 0),
            allow_edit_after_create:
                settings?.allowEditAfterProductCreation === undefined
                    ? field.allow_edit_after_create
                    : toFlag(settings?.allowEditAfterProductCreation, 1),
        }, { transaction });

        if (Array.isArray(options)) {
            await ItemCategoryFieldOption.destroy({ where: { item_category_field_id: field.id }, transaction });

            const shouldSaveOptions = OPTION_TYPES.includes(String(field.input_type).toLowerCase());
            if (shouldSaveOptions && options.length > 0) {
                const optionRows = options
                    .filter((opt) => opt?.label && opt?.value)
                    .map((opt, index) => ({
                        item_category_field_id: field.id,
                        option_label: capitalizeFirst(opt.label),
                        option_value: opt.value,
                        sort_order: toNullableInt(opt.sortOrder) || index + 1,
                        is_active: toFlag(opt.isActive, 1),
                    }));

                if (optionRows.length > 0) {
                    await ItemCategoryFieldOption.bulkCreate(optionRows, { transaction });
                }
            }
        }

        const updated = await ItemCategoryField.findByPk(field.id, {
            include: [{ model: ItemCategoryFieldOption, as: 'options', required: false }],
            transaction,
        });

        await transaction.commit();
        return res.json({ message: 'Field updated successfully', data: mapField(updated) });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating item category field:', error);
        return res.status(500).json({ error: error.message });
    }
};

exports.deleteField = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;

        const field = await ItemCategoryField.findOne({ where: { id, is_delete: 0 }, transaction });
        if (!field) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Field not found' });
        }

        await field.update({ is_delete: 1, is_active: 0 }, { transaction });
        await ItemCategoryFieldOption.update(
            { is_delete: 1, is_active: 0 },
            { where: { item_category_field_id: field.id }, transaction }
        );

        await transaction.commit();
        return res.json({ message: 'Field deleted successfully' });
    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting item category field:', error);
        return res.status(500).json({ error: error.message });
    }
};

exports.toggleFieldStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const field = await ItemCategoryField.findOne({ where: { id, is_delete: 0 } });
        if (!field) {
            return res.status(404).json({ message: 'Field not found' });
        }

        const nextStatus = Number(field.is_active) === 1 ? 0 : 1;
        await field.update({ is_active: nextStatus });

        return res.json({
            message: 'Field status updated successfully',
            data: { id: field.id, isActive: nextStatus === 1 },
        });
    } catch (error) {
        console.error('Error toggling field status:', error);
        return res.status(500).json({ error: error.message });
    }
};

exports.changeDisplayOrder = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { displayOrder, fields } = req.body;

        if (Array.isArray(fields) && fields.length > 0) {
            for (const fieldEntry of fields) {
                if (!fieldEntry?.id) continue;
                await ItemCategoryField.update(
                    { display_order: toNullableInt(fieldEntry.displayOrder) || 1 },
                    {
                        where: { id: fieldEntry.id, is_delete: 0 },
                        transaction,
                    }
                );
            }
            await transaction.commit();
            return res.json({ message: 'Display order updated successfully' });
        }

        const field = await ItemCategoryField.findOne({ where: { id, is_delete: 0 }, transaction });
        if (!field) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Field not found' });
        }

        await field.update({ display_order: toNullableInt(displayOrder) || field.display_order }, { transaction });

        await transaction.commit();
        return res.json({ message: 'Display order updated successfully' });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating display order:', error);
        return res.status(500).json({ error: error.message });
    }
};
