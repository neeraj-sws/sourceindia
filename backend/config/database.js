const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('indiaelectronics_elcina', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize;
