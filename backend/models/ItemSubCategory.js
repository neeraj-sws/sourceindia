const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ItemCategory = require('./ItemCategory');
const Categories = require('./Categories');
const SubCategories = require('./SubCategories');
const UploadImage = require('./UploadImage');
const slugify = require('slugify'); // 🟢 import slugify

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

// 🟢 Hook: Auto-generate slug before create
ItemSubCategory.beforeCreate((itemSubCategory, options) => {
  if (!itemSubCategory.slug && itemSubCategory.name) {
    itemSubCategory.slug = slugify(itemSubCategory.name, {
      lower: true,
      strict: true, // removes special characters
      remove: /[*+~.()'"!:@]/g,
    });
  }
});

// 🟢 Hook: Auto-update slug if name changes
ItemSubCategory.beforeUpdate((itemSubCategory, options) => {
  // ✅ When marking as deleted, append -deleted-{id} to name
  if (itemSubCategory.changed('is_delete') && itemSubCategory.is_delete === 1) {
    if (!itemSubCategory.name.includes('-deleted-')) {
      itemSubCategory.name = `${itemSubCategory.name}-deleted-${itemSubCategory.id}`;
    }
  }

  // Restore the original name when moving an entry out of Recently Deleted.
  if (itemSubCategory.changed('is_delete') && itemSubCategory.is_delete === 0) {
    itemSubCategory.name = itemSubCategory.name.replace(
      new RegExp(`-deleted-${itemSubCategory.id}$`, 'i'),
      ''
    );
  }

  if (itemSubCategory.changed('name')) {
    itemSubCategory.slug = slugify(itemSubCategory.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }
});

module.exports = ItemSubCategory;
