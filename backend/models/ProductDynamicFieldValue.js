const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Products = require('./Products');
const ItemCategoryField = require('./ItemCategoryField');

const ProductDynamicFieldValue = sequelize.define('ProductDynamicFieldValue', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'product_dynamic_field_value_id',
    },
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    item_category_field_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    is_delete: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    tableName: 'product_dynamic_field_values',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['product_id', 'item_category_field_id'],
            name: 'idx_product_dynamic_field_values_product_field',
        },
    ],
});

Products.hasMany(ProductDynamicFieldValue, {
    foreignKey: 'product_id',
    as: 'dynamic_field_values',
    constraints: false,
});

ProductDynamicFieldValue.belongsTo(Products, {
    foreignKey: 'product_id',
    as: 'product',
    constraints: false,
});

ItemCategoryField.hasMany(ProductDynamicFieldValue, {
    foreignKey: 'item_category_field_id',
    as: 'product_values',
    constraints: false,
});

ProductDynamicFieldValue.belongsTo(ItemCategoryField, {
    foreignKey: 'item_category_field_id',
    as: 'field',
    constraints: false,
});

module.exports = ProductDynamicFieldValue;
