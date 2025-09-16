const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('sourceindia', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize;
