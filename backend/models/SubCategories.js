const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Categories = require('./Categories');
const UploadImage = require('./UploadImage');
const slugify = require('slugify'); // 🟢 import slugify

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
  updatedAt: 'updated_at'
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

// 🟢 Hook: Auto-generate slug before create
SubCategories.beforeCreate((subCategory, options) => {
  if (!subCategory.slug && subCategory.name) {
    subCategory.slug = slugify(subCategory.name, {
      lower: true,
      strict: true, // removes special characters
      remove: /[*+~.()'"!:@]/g,
    });
  }
});

// 🟢 Hook: Auto-update slug if name changes
SubCategories.beforeUpdate((subCategory, options) => {
  if (subCategory.changed('name')) {
    subCategory.slug = slugify(subCategory.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }
});

module.exports = SubCategories;
