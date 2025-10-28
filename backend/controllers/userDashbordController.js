const Sequelize = require('sequelize');
const { Op } = Sequelize;
const bcrypt = require('bcrypt');
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