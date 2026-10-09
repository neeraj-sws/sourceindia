const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ItemCategory = require('./ItemCategory');
const ItemSubCategory = require('./ItemSubCategory');
const Categories = require('./Categories');
const SubCategories = require('./SubCategories');
const UploadImage = require('./UploadImage');
const { attachCategorySlugHooks } = require('../utils/categorySlug');

const Items = sequelize.define('Items', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'item_id',
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
    allowNull: true // 🟢 Auto-generated slug
  },
  file_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  item_category_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  item_sub_category_id: {
    type: DataTypes.INTEGER,
    allowNull: false
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
    comment: '1 = Deleted, 0 = Not Deleted'
  },
}, {
  tableName: 'items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['name'],
      where: { is_delete: 0 }, // ✅ Only apply unique constraint to active records
      name: 'uq_items_name'
    }
  ]
});

// 🟢 Associations
Items.belongsTo(ItemCategory, {
  foreignKey: 'item_category_id',
  targetKey: 'id',
  as: 'ItemCategory',
  constraints: false
});

Items.belongsTo(ItemSubCategory, {
  foreignKey: 'item_sub_category_id',
  targetKey: 'id',
  as: 'ItemSubCategory',
  constraints: false
});

Items.belongsTo(Categories, {
  foreignKey: 'category_id',
  targetKey: 'id',
  as: 'Categories',
  constraints: false
});

Items.belongsTo(SubCategories, {
  foreignKey: 'subcategory_id',
  targetKey: 'id',
  as: 'SubCategories',
  constraints: false
});

Items.belongsTo(UploadImage, {
  foreignKey: 'file_id',
  targetKey: 'id',
  onDelete: 'CASCADE'
});

// Slug follows the name, stays unique, and steps aside on delete (utils/categorySlug.js).
attachCategorySlugHooks(Items);

module.exports = Items;
