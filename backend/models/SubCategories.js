const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Categories = require('./Categories');
const UploadImage = require('./UploadImage');
const { attachCategorySlugHooks } = require('../utils/categorySlug');

const SubCategories = sequelize.define('SubCategories', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'sub_category_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: true // allowNull true because it’ll be auto-generated
  },
  category: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  file_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
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
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['name'],
      where: { is_delete: 0 }, // ✅ Only apply unique constraint to active records
      name: 'uq_sub_categories_name'
    }
  ]
});

// 🟢 Relation: SubCategory belongs to Category
SubCategories.belongsTo(Categories, {
  foreignKey: 'category',
  targetKey: 'id',
  as: 'Categories',
  constraints: false
});

// 🟢 Relation
Categories.belongsTo(UploadImage, {
  foreignKey: 'file_id',
  targetKey: 'id',
  onDelete: 'CASCADE'
});
SubCategories.belongsTo(UploadImage, {
  foreignKey: 'file_id',
  targetKey: 'id',
  onDelete: 'CASCADE'
});

// Slug follows the name, stays unique, and steps aside on delete (utils/categorySlug.js).
attachCategorySlugHooks(SubCategories);

module.exports = SubCategories;
