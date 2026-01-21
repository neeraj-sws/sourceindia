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
const Products = require('../models/Products');
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
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // 1️⃣ Categories
    const categories = await ItemCategory.findAll({
      where: { status: 1 },
      order: [["id", "DESC"]],
      raw: true,
    });

    if (!categories.length) {
      return res.json({ categories: [] });
    }

    // 2️⃣ Buyer interests (subcategory ids)
    const buyerInterests = await BuyerSourcingInterests.findAll({
      where: { user_id: userId },
      attributes: ["item_subcategory_id"],
      raw: true,
    });

    const selectedSubIds = buyerInterests.map(
      (i) => i.item_subcategory_id
    );

    if (!selectedSubIds.length) {
      // no interests → count 0
      const data = categories.map(cat => ({
        ...cat,
        count: 0
      }));

      return res.json({ categories: data });
    }

    // 3️⃣ Map subcategory → category
    const subcategories = await ItemSubCategory.findAll({
      where: { id: selectedSubIds },
      attributes: ["id", "item_category_id"],
      raw: true,
    });

    // 4️⃣ Count per category
    const categoryCountMap = {};
    subcategories.forEach(sub => {
      categoryCountMap[sub.item_category_id] =
        (categoryCountMap[sub.item_category_id] || 0) + 1;
    });

    // 5️⃣ Attach count to categories
    const data = categories.map(cat => ({
      ...cat,
      count: categoryCountMap[cat.id] || 0,
    }));

    return res.json({ categories: data });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Failed to fetch Item Category data",
    });
  }
};


exports.getItemSubcategory = async (req, res) => {
  try {
    const { categoryId, userId } = req.query;

    if (!categoryId || !userId) {
      return res.status(400).json({ error: "categoryId & userId required" });
    }

    // 1️⃣ Subcategories
    const categories = await ItemSubCategory.findAll({
      where: {
        status: 1,
        item_category_id: categoryId,
      },
      order: [["id", "DESC"]],
      raw: true,
    });

    // 2️⃣ Buyer interests
    const buyerInterests = await BuyerSourcingInterests.findAll({
      where: { user_id: userId },
      attributes: ["item_subcategory_id"],
      raw: true,
    });

    const selectedSubIds = buyerInterests.map(
      (i) => i.item_subcategory_id
    );

    // 3️⃣ Mark checked
    let checkedCount = 0;
    const subcategories = categories.map((cat) => {
      const isChecked = selectedSubIds.includes(cat.id);
      if (isChecked) checkedCount++;

      return {
        ...cat,
        checked: isChecked,
      };
    });

    return res.json({
      subcategories,
      checkedCount,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Failed to fetch Item SubCategory data",
    });
  }
};


// exports.storeItemsubcategory = async (req, res) => {
//   try {
//     const { userId, activity } = req.body;
//     if (!userId) {
//       return res.status(401).json({ error: "User ID is required" });
//     }
//     if (!activity || !activity.category_id || !Array.isArray(activity.subcategory_ids)) {
//       return res.status(400).json({
//         error: "Category and subcategory IDs are required",
//       });
//     }

//     const { category_id, subcategory_ids } = activity;

//     // 🔹 Fetch current interests for this user and category
//     const existing = await BuyerSourcingInterests.findAll({
//       where: { user_id: userId, item_category_id: category_id },
//     });

//     const existingIds = existing.map((e) => e.item_subcategory_id);

//     // 🔹 Determine which to add
//     const toAdd = subcategory_ids.filter((id) => !existingIds.includes(id));
//     const records = toAdd.map((subId) => ({
//       user_id: userId,
//       item_category_id: category_id,
//       item_subcategory_id: subId,
//       uuid: require("uuid").v4(),
//       created_at: new Date(),
//       updated_at: new Date(),
//     }));

//     // 🔹 Bulk insert new entries
//     if (records.length > 0) {
//       await BuyerSourcingInterests.bulkCreate(records);
//     }

//     // 🔹 Determine which to remove
//     const toRemove = existingIds.filter((id) => !subcategory_ids.includes(id));
//     if (toRemove.length > 0) {
//       await BuyerSourcingInterests.destroy({
//         where: {
//           user_id: userId,
//           item_category_id: category_id,
//           item_subcategory_id: toRemove,
//         },
//       });
//     }

//     // Optional: mark user as interested
//     await Users.update({ is_intrest: 1 }, { where: { id: userId } });

//     return res.json({
//       success: true,
//       message: "Buyer sourcing interests updated successfully",
//     });
//   } catch (err) {
//     console.error("storeItemsubcategory error:", err);
//     return res.status(500).json({ error: "Something went wrong" });
//   }
// };





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

    const { category_id, subcategory_ids, action } = activity;

    if (action === "add") {
      // Add only provided subcategory_ids
      const records = subcategory_ids.map((subId) => ({
        user_id: userId,
        item_category_id: category_id,
        item_subcategory_id: subId,
        uuid: require("uuid").v4(),
        created_at: new Date(),
        updated_at: new Date(),
      }));
      await BuyerSourcingInterests.bulkCreate(records);

    } else if (action === "remove") {
      // Remove only provided subcategory_ids
      await BuyerSourcingInterests.destroy({
        where: {
          user_id: userId,
          item_category_id: category_id,
          item_subcategory_id: subcategory_ids,
        },
      });

    } else {
      // Fallback: diffing arrays (full array update)
      const existing = await BuyerSourcingInterests.findAll({
        where: { user_id: userId, item_category_id: category_id },
      });

      const existingIds = existing.map((e) => e.item_subcategory_id);

      // Add new ones
      const toAdd = subcategory_ids.filter((id) => !existingIds.includes(id));
      const records = toAdd.map((subId) => ({
        user_id: userId,
        item_category_id: category_id,
        item_subcategory_id: subId,
        uuid: require("uuid").v4(),
        created_at: new Date(),
        updated_at: new Date(),
      }));
      if (records.length > 0) {
        await BuyerSourcingInterests.bulkCreate(records);
      }

      // Remove unchecked ones
      const toRemove = existingIds.filter((id) => !subcategory_ids.includes(id));
      if (toRemove.length > 0) {
        await BuyerSourcingInterests.destroy({
          where: {
            user_id: userId,
            item_category_id: category_id,
            item_subcategory_id: toRemove,
          },
        });
      }
    }

    // Optional: mark user as interested
    await Users.update({ is_intrest: 1 }, { where: { id: userId } });

    return res.json({
      success: true,
      message: "Buyer sourcing interests updated successfully",
    });
  } catch (err) {
    console.error("storeItemsubcategory error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
};





exports.getSellercompany = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "userId is required",
      });
    }

    // 1️⃣ Buyer sourcing interests
    const interests = await BuyerSourcingInterests.findAll({
      where: { user_id: userId },
      attributes: ["item_subcategory_id"],
      raw: true,
    });

    if (!interests.length) {
      return res.json({
        status: true,
        message: "No sourcing interests found",
        data: [],
      });
    }

    const itemSubcategoryIds = interests.map(i => i.item_subcategory_id);


    // 2️⃣ Get actual subcategory_id from ItemSubcategory
    const subcategories = await ItemSubCategory.findAll({
      where: { item_subcategory_id: itemSubcategoryIds },
      attributes: ["subcategory_id"],
      raw: true,
    });

    const subCategoryIds = subcategories.map(s => s.subcategory_id);

    if (!subCategoryIds.length) {
      return res.json({
        status: true,
        message: "No subcategories mapped",
        data: [],
      });
    }



    const companies = await CompanyInfo.findAll({
      where: {
        [Op.or]: subCategoryIds.map(id => ({
          sub_category: {
            [Op.like]: `%${id}%`
          }
        }))
      },
      include: [
        {
          model: UploadImage,
          as: 'companyLogo',
          attributes: ['file'],
          required: false,
        },
      ],
    });

    // Attach state_name and city_name
    for (const comp of companies) {
      const user = await Users.findOne({
        where: { company_id: comp.id },
        attributes: ['state', 'city'],
      });
      let stateName = null;
      let cityName = null;
      if (user?.state) {
        const state = await States.findOne({
          where: { id: user.state },
          attributes: ['name'],
        });
        stateName = state ? state.name : null;
      }
      if (user?.city) {
        const city = await Cities.findOne({
          where: { id: user.city },
          attributes: ['name'],
        });
        cityName = city ? city.name : null;
      }
      comp.dataValues.state_name = stateName;
      comp.dataValues.city_name = cityName;
    }

    return res.json({
      status: true,
      message: "Companies fetched successfully",
      data: companies,
    });

  } catch (error) {
    console.error("Seller Company Error:", error);
    res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
};

exports.getProductbuyercate = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "userId is required",
      });
    }

    // Buyer interests
    const interests = await BuyerSourcingInterests.findAll({
      where: { user_id: userId },
      attributes: ["item_category_id", "item_subcategory_id"],
    });

    if (!interests.length) {
      return res.json({
        status: true,
        message: "No sourcing interests found",
        data: [],
      });
    }

    const categoryIds = interests.map(i => i.item_category_id);
    const subCategoryIds = interests.map(i => i.item_subcategory_id);

    // ✅ Products + UploadImage
    const products = await Products.findAll({
      where: {
        item_category_id: categoryIds,
        item_subcategory_id: subCategoryIds,
        status: 1,
        is_approve: 1,
        is_delete: 0,
      },
      include: [
        {
          model: UploadImage,
          as: 'file',
          attributes: ['file'],
          required: false, // image na ho tab bhi product aaye
        },
      ],
      order: Sequelize.literal("RAND()"),
      limit: 10,
    });

    return res.json({
      status: true,
      message: "Products fetched successfully",
      data: products,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
};