const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailVerification = sequelize.define('EmailVerification', {
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: false
  },
  is_verify: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

}, {
  tableName: 'email_verifies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});


module.exports = EmailVerification;