const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Countries = require('./Countries');

const States = sequelize.define('States', {
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
