const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ItemCategory = require('./ItemCategory');
const Categories = require('./Categories');
const SubCategories = require('./SubCategories');
const UploadImage = require('./UploadImage');
const { attachCategorySlugHooks } = require('../utils/categorySlug');

const ItemSubCategory = sequelize.define('ItemSubCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'item_subcategory_id',
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
    allowNull: true // 🟢 auto-generated slug
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
  tableName: 'item_subcategory',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['name'],
      where: { is_delete: 0 }, // ✅ Only apply unique constraint to active records
      name: 'uq_item_subcategory_name'
    }
  ]
});

// 🟢 Associations
ItemSubCategory.belongsTo(ItemCategory, {
  foreignKey: 'item_category_id',
  targetKey: 'id',
  as: 'ItemCategory',
  constraints: false
});

ItemSubCategory.belongsTo(Categories, {
  foreignKey: 'category_id',
  targetKey: 'id',
  as: 'Categories',
  constraints: false
});

ItemSubCategory.belongsTo(SubCategories, {
  foreignKey: 'subcategory_id',
  targetKey: 'id',
  as: 'SubCategories',
  constraints: false
});

ItemSubCategory.belongsTo(UploadImage, {
  foreignKey: 'file_id',
  targetKey: 'id',
  onDelete: 'CASCADE'
});

// Slug follows the name, stays unique, and steps aside on delete (utils/categorySlug.js).
attachCategorySlugHooks(ItemSubCategory);

module.exports = ItemSubCategory;
