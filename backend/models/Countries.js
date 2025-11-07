const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Countries = sequelize.define('Countries', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'country_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
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
