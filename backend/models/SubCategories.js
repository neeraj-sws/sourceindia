const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Categories = require('./Categories');

const SubCategories = sequelize.define('SubCategories', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
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
  tableName: 'sub_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

SubCategories.belongsTo(Categories, { foreignKey: 'category', targetKey: 'id', as: 'Categories', constraints: false });

module.exports = SubCategories;