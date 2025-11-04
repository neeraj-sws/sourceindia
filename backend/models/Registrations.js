const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const States = require('./States');
const Cities = require('./Cities');

const Registrations = sequelize.define('Registrations', {
  category: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: true },
  designation: { type: DataTypes.STRING, allowNull: false },
  organization: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  mobile: { type: DataTypes.STRING, allowNull: true },
  state: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  city: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  is_delete: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
}, {
  tableName: 'registrations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Registrations.belongsTo(States, { foreignKey: 'state', targetKey: 'id', as: 'state_data', constraints: false });
Registrations.belongsTo(Cities, { foreignKey: 'city', targetKey: 'id', as: 'city_data', constraints: false });

module.exports = Registrations;
