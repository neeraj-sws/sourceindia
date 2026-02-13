const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const TicketCategory = require('./TicketCategory');

const Roles = sequelize.define('Roles', {
   id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'role_id',
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
  ticket_category: {
    type: DataTypes.INTEGER,
    allowNull: false
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
  pages: {
  type: DataTypes.TEXT, // store JSON
  allowNull: true
},
}, {
  tableName: 'roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Roles.belongsTo(TicketCategory, { foreignKey: 'ticket_category', targetKey: 'id', as: 'TicketCategory', constraints: false });

module.exports = Roles;