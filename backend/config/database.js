const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'sourceindia_live',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    pool: {
      max: Number(process.env.DB_POOL_MAX) || 20,
      min: Number(process.env.DB_POOL_MIN) || 0,
      acquire: Number(process.env.DB_POOL_ACQUIRE) || 60000,
      idle: Number(process.env.DB_POOL_IDLE) || 10000,
    },
    dialectOptions: {
      connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT) || 60000,
    },
    logging: false,
  }
);

module.exports = sequelize;
