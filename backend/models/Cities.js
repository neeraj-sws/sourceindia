const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const States = require('./States');

const Cities = sequelize.define('Cities', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'city_id',
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
  state_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'cities',
  timestamps: false,
});

Cities.belongsTo(States, { foreignKey: 'state_id', targetKey: 'id', as: 'States', constraints: false });

module.exports = Cities;
