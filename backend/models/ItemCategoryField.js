const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemCategoryField = sequelize.define('ItemCategoryField', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'item_category_field_id',
    },
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
    },
    item_category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    field_label: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    field_key: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    input_type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    required: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '1 = required, 0 = optional',
    },
    placeholder: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    default_value: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    help_text: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    display_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    is_active: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    min_length: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    max_length: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    min_value: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: true,
    },
    max_value: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: true,
    },
    regex_pattern: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    is_searchable: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    is_filterable: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    show_on_detail: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    show_on_listing: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    allow_edit_after_create: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    is_delete: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    tableName: 'item_category_fields',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['item_category_id', 'display_order'],
            name: 'idx_item_category_fields_order',
        },
        {
            unique: true,
            fields: ['item_category_id', 'field_key', 'is_delete'],
            name: 'uq_item_category_field_key_active',
        },
    ],
});

module.exports = ItemCategoryField;
