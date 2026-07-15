const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ItemCategoryField = require('./ItemCategoryField');

const ItemCategoryFieldOption = sequelize.define('ItemCategoryFieldOption', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'item_category_field_option_id',
    },
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
    },
    item_category_field_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    option_label: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    option_value: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    is_active: {
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
    tableName: 'item_category_field_options',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['item_category_field_id', 'sort_order'],
            name: 'idx_item_category_field_options_order',
        },
    ],
});

ItemCategoryField.hasMany(ItemCategoryFieldOption, {
    foreignKey: 'item_category_field_id',
    as: 'options',
    constraints: false,
});

ItemCategoryFieldOption.belongsTo(ItemCategoryField, {
    foreignKey: 'item_category_field_id',
    as: 'field',
    constraints: false,
});

module.exports = ItemCategoryFieldOption;
