const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('./Users');

const OpenEnquiries = sequelize.define('OpenEnquiries', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'open_enquriy_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT('long'), allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  ip_address: { type: DataTypes.TEXT('long'), allowNull: false },
  is_home: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.INTEGER, allowNull: true },
  is_delete: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  is_email: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  name: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  company: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'open_enquriys',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

OpenEnquiries.belongsTo(Users, { foreignKey: 'user_id', targetKey: 'id', as: 'Users', constraints: false });

module.exports = OpenEnquiries;