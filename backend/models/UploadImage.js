const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UploadImage = sequelize.define('UploadImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'upload_image_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  file: { type: DataTypes.STRING, allowNull: false },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP'), onUpdate: sequelize.literal('CURRENT_TIMESTAMP') }
}, {
  tableName: 'upload_images',
  timestamps: false,
});

module.exports = UploadImage;