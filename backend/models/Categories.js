const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UploadImage = require('./UploadImage');
const { attachCategorySlugHooks } = require('../utils/categorySlug');

const Categories = sequelize.define('Categories', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'category_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
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
  slug: {
    type: DataTypes.STRING,
    allowNull: true
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
  is_other: {
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
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['name'],
      where: { is_delete: 0 }, // ✅ Only apply unique constraint to active records
      name: 'uq_categories_name'
    }
  ]
});

// 🟢 Relation
Categories.belongsTo(UploadImage, {
  as: 'CategoryImage',
  foreignKey: 'cat_file_id',
  targetKey: 'id',
  onDelete: 'CASCADE'
});

// Slug follows the name, stays unique, and steps aside on delete (utils/categorySlug.js).
attachCategorySlugHooks(Categories);

module.exports = Categories;
