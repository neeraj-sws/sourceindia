const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Products = require('./Products');

const ProductOtherSpecification = sequelize.define('ProductOtherSpecification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'product_other_specification_id' },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  value: { type: DataTypes.TEXT, allowNull: false },
  is_delete: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'product_other_specifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{ fields: ['product_id'], name: 'idx_product_other_specifications_product' }],
});

Products.hasMany(ProductOtherSpecification, { foreignKey: 'product_id', as: 'other_specifications', constraints: false });
ProductOtherSpecification.belongsTo(Products, { foreignKey: 'product_id', as: 'product', constraints: false });

module.exports = ProductOtherSpecification;
