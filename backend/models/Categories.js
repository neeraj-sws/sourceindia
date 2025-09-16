const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UploadImage = require('./UploadImage');

const Categories = sequelize.define('Categories', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cat_file_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  stock_file_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  prefix: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1 = Active, 0 = Inactive'
  },
  top_category: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  is_delete: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Categories.belongsTo(UploadImage, { foreignKey: 'cat_file_id', targetKey: 'id', onDelete: 'CASCADE' });

module.exports = Categories;
