const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('sourceindia_live', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize;
