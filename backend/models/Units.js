const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Reference list of quantity units offered in the Post Buy Requirement form.
// The options live here rather than in a frontend array so the list can be
// maintained without touching or redeploying the form.
const Units = sequelize.define('Units', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Display label, e.g. "Kilogram"',
  },
  is_active: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1 = offered in the dropdown, 0 = hidden but kept for historical rows',
  },
}, {
  tableName: 'units',
  timestamps: false,
});

module.exports = Units;