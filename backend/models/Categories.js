const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UploadImage = require('./UploadImage');
const slugify = require('slugify'); 

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

// 🟢 Relation
Categories.belongsTo(UploadImage, { 
  foreignKey: 'cat_file_id', 
  targetKey: 'id', 
  onDelete: 'CASCADE' 
});

// 🟢 Hook: Auto slug generate from name
Categories.beforeCreate((category, options) => {
  if (!category.slug && category.name) {
    category.slug = slugify(category.name, {
      lower: true,
      strict: true, // removes special chars
      remove: /[*+~.()'"!:@]/g,
    });
  }
});

// 🟢 Hook: Auto-update slug if name changes
Categories.beforeUpdate((category, options) => {
  if (category.changed('name')) {
    category.slug = slugify(category.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }
});

module.exports = Categories;
