const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ItemCategory = require('./ItemCategory');
const ItemSubCategory = require('./ItemSubCategory');
const Categories = require('./Categories');
const SubCategories = require('./SubCategories');
const UploadImage = require('./UploadImage');

const Items = sequelize.define('Items', {
  name: { type: DataTypes.STRING, allowNull: false },
  file_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  item_category_id: { type: DataTypes.INTEGER, allowNull: false },
  item_sub_category_id: { type: DataTypes.INTEGER, allowNull: false },
  category_id: { type: DataTypes.INTEGER, allowNull: false },
  subcategory_id: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, comment: '1 = Active, 0 = Inactive' },
}, {
  tableName: 'items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Items.belongsTo(ItemCategory, { foreignKey: 'item_category_id', targetKey: 'id', as: 'ItemCategory', constraints: false });
Items.belongsTo(ItemSubCategory, { foreignKey: 'item_sub_category_id', targetKey: 'id', as: 'ItemSubCategory', constraints: false });
Items.belongsTo(Categories, { foreignKey: 'category_id', targetKey: 'id', as: 'Categories', constraints: false });
Items.belongsTo(SubCategories, { foreignKey: 'subcategory_id', targetKey: 'id', as: 'SubCategories', constraints: false });
Items.belongsTo(UploadImage, { foreignKey: 'file_id', targetKey: 'id', onDelete: 'CASCADE' });

module.exports = Items;
