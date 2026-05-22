const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Keyword = require('./Keyword'); // Assuming Keyword model exists

const KeywordImport = sequelize.define('KeywordImport', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    item_subcategory_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
    },
}, {
    tableName: 'keyword_imports',
    timestamps: true,
});

KeywordImport.belongsTo(Keyword, {
    foreignKey: 'item_subcategory_id',
    as: 'itemSubCategory',
});

module.exports = KeywordImport;