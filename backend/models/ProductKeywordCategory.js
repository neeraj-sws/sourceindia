const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ItemCategory = require('./ItemCategory');

// Keywords linked to an Item Category (Keyword Master > Product Keyword Category).
// Same product_keywords table as ProductKeyword; these rows always have item_subcategory_id = 0
// and carry the Item Category in item_category_id.
const ProductKeywordCategory = sequelize.define('ProductKeywordCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'product_keyword_id',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  item_subcategory_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  item_category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1 = Active, 0 = Inactive'
  },
  is_main: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '1 = managed by Item Category, 0 = manually managed keyword'
  },
}, {
  tableName: 'product_keywords',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

ProductKeywordCategory.belongsTo(ItemCategory, {
  foreignKey: 'item_category_id',
  targetKey: 'id',
  as: 'ItemCategory',
  constraints: false
});

module.exports = ProductKeywordCategory;
