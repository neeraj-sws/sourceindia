const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pages = sequelize.define('Pages', {
    id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'page_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  is_edit: { type: DataTypes.INTEGER, allowNull: false },
  meta_title: { type: DataTypes.STRING, allowNull: true },
  meta_keyword: { type: DataTypes.STRING, allowNull: true },
  meta_description: { type: DataTypes.STRING, allowNull: true },
  is_delete: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'pages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Pages;