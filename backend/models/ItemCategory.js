const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Categories = require('./Categories');
const SubCategories = require('./SubCategories');
const UploadImage = require('./UploadImage');

const ItemCategory = sequelize.define('ItemCategory', {
  name: { type: DataTypes.STRING, allowNull: false },
  file_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  category_id: { type: DataTypes.INTEGER, allowNull: false },
  subcategory_id: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, comment: '1 = Active, 0 = Inactive' },
}, {
  tableName: 'item_category',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

ItemCategory.belongsTo(Categories, { foreignKey: 'category_id', targetKey: 'id', as: 'Categories', constraints: false });
ItemCategory.belongsTo(SubCategories, { foreignKey: 'subcategory_id', targetKey: 'id', as: 'SubCategories', constraints: false });
ItemCategory.belongsTo(UploadImage, { foreignKey: 'file_id', targetKey: 'id', onDelete: 'CASCADE' });

module.exports = ItemCategory;
