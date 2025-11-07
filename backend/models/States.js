const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Countries = require('./Countries');

const States = sequelize.define('States', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'state_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  country_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'states',
  timestamps: false,
});

States.belongsTo(Countries, { foreignKey: 'country_id', targetKey: 'id', as: 'Countries', constraints: false });

module.exports = States;
