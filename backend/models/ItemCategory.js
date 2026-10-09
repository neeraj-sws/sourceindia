const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Categories = require('./Categories');
const SubCategories = require('./SubCategories');
const UploadImage = require('./UploadImage');
const { attachCategorySlugHooks } = require('../utils/categorySlug');

const ItemCategory = sequelize.define('ItemCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'item_category_id',
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
    allowNull: true // auto-generated
  },
  file_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subcategory_id: {
    type: DataTypes.INTEGER,
    allowNull: false
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
  tableName: 'item_category',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['name'],
      where: { is_delete: 0 }, // ✅ Only apply unique constraint to active records
      name: 'uq_item_category_name'
    }
  ]
});

// 🟢 Associations
ItemCategory.belongsTo(Categories, {
  foreignKey: 'category_id',
  targetKey: 'id',
  as: 'Categories',
  constraints: false
});

ItemCategory.belongsTo(SubCategories, {
  foreignKey: 'subcategory_id',
  targetKey: 'id',
  as: 'SubCategories',
  constraints: false
});

ItemCategory.belongsTo(UploadImage, {
  foreignKey: 'file_id',
  targetKey: 'id',
  onDelete: 'CASCADE'
});

// Slug follows the name, stays unique, and steps aside on delete (utils/categorySlug.js).
attachCategorySlugHooks(ItemCategory);

module.exports = ItemCategory;
