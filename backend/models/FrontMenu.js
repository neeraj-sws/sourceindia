const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FrontMenu = sequelize.define('FrontMenu', {
    id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'front_menu_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  parent_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  name: { type: DataTypes.STRING, allowNull: false },
  link: { type: DataTypes.TEXT, allowNull: false },
  is_show: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.INTEGER, allowNull: false, comment: "1 = Header, 2 = Footer" },
  position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  tableName: 'front_menu',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = FrontMenu;