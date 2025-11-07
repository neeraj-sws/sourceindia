const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Color = require('./Color');
const UploadImage = require('./UploadImage');

const InterestCategories = sequelize.define('InterestCategories', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'interest_category_id',
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
  color: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1 = Active, 0 = Inactive'
  },
}, {
  tableName: 'interest_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

InterestCategories.belongsTo(Color, { foreignKey: 'color', targetKey: 'id', as: 'Color', constraints: false });
InterestCategories.belongsTo(UploadImage, { foreignKey: 'file_id', targetKey: 'id', onDelete: 'CASCADE' });

module.exports = InterestCategories;
