const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MailMaster = sequelize.define('MailMaster', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'mail_master_id',
  },

  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  list: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },

  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    onUpdate: sequelize.literal('CURRENT_TIMESTAMP')
  },

}, {
  tableName: 'mail_master',
  timestamps: false,
});


module.exports = MailMaster;