const Sequelize = require('sequelize');
const { Op } = Sequelize;
const bcrypt = require('bcryptjs');
const Users = require('../models/Users');
const Countries = require('../models/Countries');
const OpenEnquriy = require('../models/OpenEnquiries');
const States = require('../models/States');
const Cities = require('../models/Cities');
const Emails = require('../models/Emails');
const EmailVerification = require('../models/EmailVerification');
const MembershipPlan = require('../models/MembershipPlan');
const CompanyInfo = require('../models/CompanyInfo');
const MembershipDetail = require('../models/MembershipDetail');
const CoreActivity = require('../models/CoreActivity');
const Activity = require('../models/Activity');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const UploadImage = require('../models/UploadImage');
const InterestSubCategories = require('../models/InterestSubCategories');
const InterestCategories = require('../models/InterestCategories');
const BuyerInterests = require('../models/BuyerInterests');
const ItemCategory = require('../models/ItemCategory');
const ItemSubCategory = require('../models/ItemSubCategory');
const BuyerSourcingInterests = require('../models/BuyerSourcingInterests');
const { getTransporter } = require('../helpers/mailHelper');
const { generateUniqueSlug } = require('../helpers/mailHelper');
const getMulterUpload = require('../utils/upload');
const nodemailer = require('nodemailer');
const secretKey = 'your_secret_key';
const jwt = require('jsonwebtoken');


exports.getBuyerInterest = async (req, res) => {
  try {
    const categories = await InterestCategories.findAll({
      order: [['id', 'DESC']],
    });

    const coreArr = {};
    for (const category of categories) {
      coreArr[category.id] = await InterestSubCategories.findAll({
        where: { interest_category_id: category.id },
      });
    }

    return res.json({ categories, subCategories: coreArr });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch buyer interest data' });
  }
};

exports.storeBuyerInterest = async (req, res) => {
  try {
    const { userId } = req.body; // Get userId from body
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const { activity } = req.body;
    if (!activity || Object.keys(activity).length === 0) {
      return res.status(400).json({ error: 'At least one activity is required' });
    }

    await BuyerInterests.destroy({ where: { buyer_id: userId } });

    for (const [coreActivityId, subActivityIds] of Object.entries(activity)) {
      if (Array.isArray(subActivityIds)) {
        for (const activityId of subActivityIds) {
          await BuyerInterests.create({
            buyer_id: userId,
            core_activity_id: parseInt(coreActivityId),
            activity_id: parseInt(activityId),
            created_at: new Date(),
            updated_at: new Date(),
          });
        }
      }
    }

    await Users.update(
      { is_intrest: 1 },
      { where: { id: userId } }
    );

    return res.json({ success: 1, message: 'Interest Added Successfully' });
  } catch (error) {
    console.error('Error storing buyer interest:', error);
    return res.status(500).json({ error: 'Failed to store buyer interest' });
  }
};

exports.getBuyerInterestchecked = async (req, res) => {
  try {
    const { userId } = req.query; // Get userId from query parameter
    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const coreActivity = await InterestCategories.findAll({
      order: [['id', 'DESC']],
    });

    const coreArr = {};
    for (const category of coreActivity) {
      coreArr[category.id] = await InterestSubCategories.findAll({
        where: { interest_category_id: category.id },
      });
    }

    const getBuyerInterest = await BuyerInterests.findAll({
      where: { buyer_id: userId },
    });

    const checked = {};
    getBuyerInterest.forEach((interest) => {
      if (!checked[interest.core_activity_id]) {
        checked[interest.core_activity_id] = [];
      }
      checked[interest.core_activity_id].push(interest.activity_id);
    });

    return res.json({
      categories: coreActivity,
      subCategories: coreArr,
      checked,
    });
  } catch (error) {
    console.error('Error fetching buyer interest:', error);
    return res.status(500).json({ error: 'Failed to fetch buyer interest' });
  }
};

exports.getItemType = async (req, res) => {
  try {
    const categories = await ItemCategory.findAll({
      where: {
        status: 1, // 🔥 yahan mapping
      },
      order: [['id', 'DESC']],
    });

    return res.json({ categories });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch Item Category data' });
  }
};

exports.getItemSubcategory = async (req, res) => {
  try {
    const { categoryId } = req.query;
    if (!categoryId) {
      return res.status(400).json({ error: 'categoryId is required' });
    }

    const categories = await ItemSubCategory.findAll({
      where: {
        status: 1,
        item_category_id: categoryId,
      },
      order: [['id', 'DESC']],
    });

    return res.json({ subcategories: categories });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: 'Failed to fetch Item SubCategory data',
    });
  }
};
// exports.storeItemsubcategory = async (req, res) => {

//   const { userId } = req.body; // Get userId from body
//   if (!userId) {
//     return res.status(401).json({ error: 'User ID is required' });
//   }

//   const { activity } = req.body;
//   if (!activity || Object.keys(activity).length === 0) {
//     return res.status(400).json({ error: 'At least one activity is required' });
//   }

//   await BuyerSourcingInterests.destroy({ where: { buyer_id: userId } });



//   // await Users.update(
//   //   { is_intrest: 1 },
//   //   { where: { id: userId } }
//   // );
// }

exports.storeItemsubcategory = async (req, res) => {
  try {
    const { userId, activity } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User ID is required" });
    }

    if (
      !activity ||
      !activity.category_id ||
      !Array.isArray(activity.subcategory_ids) ||
      activity.subcategory_ids.length === 0
    ) {
      return res.status(400).json({
        error: "Category and at least one subcategory are required",
      });
    }

    const { category_id, subcategory_ids } = activity;

    // 🔥 DELETE OLD INTERESTS (IMPORTANT)
    await BuyerSourcingInterests.destroy({
      where: { user_id: userId },
    });

    // 🔥 PREPARE RECORDS
    const records = subcategory_ids.map((subId) => ({
      user_id: userId,
      item_category_id: category_id,
      item_subcategory_id: subId,
      uuid: require("uuid").v4(),
      created_at: new Date(),
      updated_at: new Date(),
    }));

    // 🔥 BULK INSERT
    await BuyerSourcingInterests.bulkCreate(records);
    await Users.update(
      { is_intrest: 1 },
      { where: { id: userId } }
    );
    return res.json({
      success: true,
      message: "Buyer sourcing interests saved successfully",
    });
  } catch (err) {
    console.error("storeItemsubcategory error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
};