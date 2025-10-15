const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UploadImage = require('./UploadImage');

const HomeBanners = sequelize.define('HomeBanners', {
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sub_title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  button_text: {
    type: DataTypes.STRING,
    allowNull: true
  },
  button_url: {
    type: DataTypes.STRING,
    allowNull: true
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
  is_delete: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'home_banners',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

HomeBanners.belongsTo(UploadImage, { foreignKey: 'file_id', targetKey: 'id', onDelete: 'CASCADE' });

module.exports = HomeBanners;
