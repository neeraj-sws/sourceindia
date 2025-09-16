const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Roles = require('./Roles');
const TicketCategory = require('./TicketCategory');

const Admin = sequelize.define('Admin', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  email_verified_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
  password: { type: DataTypes.STRING, allowNull: false },
  postcode: { type: DataTypes.INTEGER, allowNull: false },
  role: { type: DataTypes.INTEGER, allowNull: false },
  mobile: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: false },
  remember_token: { type: DataTypes.STRING(100), allowNull: true },
  state: { type: DataTypes.INTEGER, allowNull: false },
  country: { type: DataTypes.STRING, allowNull: true },
  is_seller: { type: DataTypes.INTEGER, allowNull: false },
  about: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, comment: '1 = Active, 0 = Inactive' },
  ticket_category: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'admins',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Admin.belongsTo(Roles, { foreignKey: 'role', targetKey: 'id', as: 'Roles', constraints: false });
Admin.belongsTo(TicketCategory, { foreignKey: 'ticket_category', targetKey: 'id', as: 'TicketCategory', constraints: false });

module.exports = Admin;