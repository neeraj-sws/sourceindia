const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UploadImage = require('./UploadImage');

const Applications = sequelize.define('Applications', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'application_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  name: { type: DataTypes.STRING, allowNull: false },
  cat_file_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  stock_file_id: { type: DataTypes.INTEGER, allowNull: true },
  prefix: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, comment: '1 = Active, 0 = Inactive' },
  top_category: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  is_delete: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'applications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Applications.belongsTo(UploadImage, { foreignKey: 'cat_file_id', targetKey: 'id', onDelete: 'CASCADE' });
// Applications.belongsTo(UploadImage, { foreignKey: 'stock_file_id', targetKey: 'id', as: 'stock_file', onDelete: 'CASCADE' });

module.exports = Applications;