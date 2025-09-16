const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Countries = sequelize.define('Countries', {
  sortname: {
    type: DataTypes.STRING(3),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  phonecode: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'countries',
  timestamps: false,
});

module.exports = Countries;
