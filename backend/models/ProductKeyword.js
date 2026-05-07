const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ItemSubCategory = require('./ItemSubCategory');
const slugify = require('slugify'); // import slugify

const ProductKeyword = sequelize.define('ProductKeyword', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'product_keyword_id',
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
  item_subcategory_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1 = Active, 0 = Inactive'
  },
}, {
  tableName: 'product_keywords',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});


ProductKeyword.belongsTo(ItemSubCategory, {
  foreignKey: 'item_subcategory_id',
  targetKey: 'id',
  as: 'ItemSubCategory',
  constraints: false
});



// 🟢 Hook: Auto-generate slug before create
ProductKeyword.beforeCreate((productKeyword, options) => {
  if (!productKeyword.slug && productKeyword.name) {
    productKeyword.slug = slugify(productKeyword.name, {
      lower: true,
      strict: true, // removes special characters
      remove: /[*+~.()'"!:@]/g,
    });
  }
});

// 🟢 Hook: Auto-update slug if name changes
ProductKeyword.beforeUpdate((productKeyword, options) => {
  if (productKeyword.changed('name')) {
    productKeyword.slug = slugify(productKeyword.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }
});

module.exports = ProductKeyword;
