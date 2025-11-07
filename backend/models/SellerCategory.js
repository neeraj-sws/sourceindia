const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Categories = require('./Categories');
const SubCategories = require('./SubCategories');

const SellerCategory = sequelize.define("SellerCategory", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'seller_category_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  subcategory_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "seller_categories",
  timestamps: false,
});

// 🔹 Relations
SellerCategory.belongsTo(Categories, {
  foreignKey: "category_id",
  as: "category",
});

SellerCategory.belongsTo(SubCategories, {
  foreignKey: "subcategory_id",
  as: "subcategory",
});

module.exports = SellerCategory;
