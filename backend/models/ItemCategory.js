const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Categories = require('./Categories');
const SubCategories = require('./SubCategories');
const UploadImage = require('./UploadImage');
const slugify = require('slugify'); // 🟢 import slugify

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

// 🟢 Hook: Auto-generate slug before create
ItemCategory.beforeCreate((itemCategory, options) => {
  if (!itemCategory.slug && itemCategory.name) {
    itemCategory.slug = slugify(itemCategory.name, {
      lower: true,
      strict: true, // remove special chars
      remove: /[*+~.()'"!:@]/g,
    });
  }
});

// 🟢 Hook: Auto-update slug if name changes
ItemCategory.beforeUpdate((itemCategory, options) => {
  // ✅ When marking as deleted, append -deleted-{id} to name
  if (itemCategory.changed('is_delete') && itemCategory.is_delete === 1) {
    if (!itemCategory.name.includes('-deleted-')) {
      itemCategory.name = `${itemCategory.name}-deleted-${itemCategory.id}`;
    }
  }

  if (itemCategory.changed('name')) {
    itemCategory.slug = slugify(itemCategory.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }
});

module.exports = ItemCategory;
