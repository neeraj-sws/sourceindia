const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const InterestCategories = require('./InterestCategories');
const InterestSubCategories = require('./InterestSubCategories');

const SubSubCategories = sequelize.define('SubSubCategories', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  sub_category: {
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
  is_delete: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'sub_sub_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

SubSubCategories.belongsTo(InterestCategories, { foreignKey: 'category', targetKey: 'id', as: 'InterestCategories', constraints: false });
SubSubCategories.belongsTo(InterestSubCategories, { foreignKey: 'sub_category', targetKey: 'id', as: 'InterestSubCategories', constraints: false });

module.exports = SubSubCategories;