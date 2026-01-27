
const Sequelize = require('sequelize');
const { Op } = Sequelize;
const sequelize = require('../config/database');
const path = require('path');
const fs = require('fs');
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
const SellerCategory = require('../models/SellerCategory');
const { getTransporter } = require('../helpers/mailHelper');
const { generateUniqueSlug } = require('../helpers/mailHelper');
const getMulterUpload = require('../utils/upload');
const nodemailer = require('nodemailer');
const secretKey = 'your_secret_key';
const jwt = require('jsonwebtoken');
const { insertSellerCategoriesFromCompany } = require('../helpers/mailHelper');


exports.insertFromCompany = async (req, res) => {
  try {
    const [companies] = await sequelize.query(`
      SELECT 
        u.id AS user_id,
        ci.category_sell,
        ci.sub_category
      FROM company_info ci
      INNER JOIN users u ON u.company_id = ci.id
      WHERE ci.category_sell IS NOT NULL
    `);

    if (!companies.length) {
      console.log('⚠️ No company records found.');
      return res.json({ success: false, message: 'No company records found.' });
    }

    for (const company of companies) {
      const category_sell = company.category_sell?.split(',').map(c => c.trim()).filter(Boolean) || [];
      const sub_category = company.sub_category?.split(',').map(g => g.trim()).filter(Boolean) || [];

      // 🧹 Step 1: Remove all existing entries for this user
      await SellerCategory.destroy({
        where: { user_id: company.user_id },
      });

      // 2️⃣ Fetch all subcategories (with category_id)
      const subCategories = await SubCategories.findAll({
        where: { id: sub_category },
        attributes: ['id', 'category'],
      });

      // 3️⃣ Prepare entries where subcategory exists
      const sellerCategoryData = subCategories.map((sub) => ({
        user_id: company.user_id,
        category_id: sub.category,
        subcategory_id: sub.id,
      }));

      // 4️⃣ Get categories that already have subcategories
      const categoriesWithSub = [...new Set(subCategories.map((sub) => sub.category))];

      // 5️⃣ Exclude those categories from null entries
      const categoriesWithoutSub = category_sell.filter(
        (catId) => !categoriesWithSub.includes(Number(catId))
      );

      // 6️⃣ Add entries for categories without subcategory (subcategory_id = null)
      categoriesWithoutSub.forEach((catId) => {
        sellerCategoryData.push({
          user_id: company.user_id,
          category_id: Number(catId),
          subcategory_id: null,
        });
      });

      // 7️⃣ Insert all new data
      if (sellerCategoryData.length) {
        await SellerCategory.bulkCreate(sellerCategoryData);
      }
    }

    console.log('🎯 All company seller categories processed successfully.');
    res.json({
      success: true,
      message: 'Seller categories inserted successfully (old removed, no duplicate null category).',
    });

  } catch (error) {
    console.error('❌ Error inserting seller categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await Users.findOne({
      where: { email: email, is_delete: 0 },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log("Plain password:", password);
    console.log("Stored hash:", user.password);

    // Fix for PHP-style bcrypt hashes
    let hash = user.password.replace(/^\$2y\$/, '$2a$');
    const isMatch = await bcrypt.compare(password, hash);

    console.log("Match result:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, is_seller: user.is_seller },
      'your_jwt_secret_key',
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        is_seller: user.is_seller,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send OTP
exports.sendOtp = async (req, res) => {
  // try {
  const { email } = req.body;

  const existingUser = await Users.findOne({ where: { email } });
  if (existingUser) return res.status(400).json({ error: "Email already taken" });

  const otp = Math.floor(1000 + Math.random() * 9000);

  let emailRecord = await EmailVerification.findOne({ where: { email } });
  if (emailRecord) {
    emailRecord.otp = otp;
    emailRecord.is_verify = 0;
    await emailRecord.save();
  } else {
    emailRecord = await EmailVerification.create({ email, otp, is_verify: 0 });
  }

  const emailTemplate = await Emails.findByPk(99);
  const msgStr = emailTemplate.message.toString('utf8');
  let userMessage = msgStr.replace("{{ USER_PASSWORD }}", otp);

  const { transporter, buildEmailHtml } = await getTransporter();
  const htmlContent = await buildEmailHtml(userMessage);

  await transporter.sendMail({
    from: `"OTP Verification" <info@sourceindia-electronics.com>`,
    to: email,
    subject: emailTemplate?.subject || "Verify your email",
    html: htmlContent,
  });

  return res.json({ message: "OTP sent successfully", user_id: emailRecord.id });
  // } catch (err) {
  //   console.error(err);
  //   return res.status(500).json({ error: "Failed to send OTP" });
  // }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, user_id } = req.body;
    const record = await EmailVerification.findOne({ where: { email, id: user_id } });
    if (!record) return res.status(400).json({ error: "Verification data not found" });

    if (record.otp.toString() === otp.toString()) {
      record.is_verify = 1;
      await record.save();
      return res.json({ message: "Email verified successfully!" });
    } else {
      return res.status(400).json({ error: "Invalid OTP" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "OTP verification failed" });
  }
};

// Register User
exports.register = async (req, res) => {

  try {
    const {
      fname,
      lname,
      cname,
      website,
      mobile,
      alternate_number,
      country_code,
      email,
      category,
      elcina_member,
      is_trading,
      user_category,
      products,
      country,
      state,
      city,
      address,
      pinCode,
      logo_id,
    } = req.body;

    // ---------------------------
    // 🔹 Step 1: Validate required fields
    // ---------------------------
    let errors = {};

    if (!fname) errors.fname = "First name is required";
    if (!lname) errors.lname = "Last name is required";
    if (!mobile) errors.mobile = "Mobile number is required";
    // if (!country_code) errors.country_code = "Mobile number is required";
    if (!email) errors.email = "Email is required";
    if (!category) errors.category = "Category is required";
    if (!elcina_member) errors.elcina_member = "Elcina membership field is required";
    if (!cname) errors.cname = "Company name is required";
    if (!country) errors.country = "Country is required";
    if (!state) errors.state = "State is required";
    if (!city) errors.city = "City is required";
    if (!address) errors.address = "Address is required";
    if (!pinCode) errors.pinCode = "PIN code is required";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // ---------------------------
    // 🔹 Step 2: Check unique email
    // ---------------------------
    const existingUser = await Users.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        errors: { email: "Email already registered" },
      });
    }

    // ---------------------------
    // 🔹 Step 3: Generate OTP-like password
    // ---------------------------
    const year = new Date().getFullYear(); // current year
    const randomNumber = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    const otp = `SI${year}${randomNumber}`;

    const hashedPassword = await bcrypt.hash(String(otp), 10);
    // ---------------------------
    // 🔹 Step 4: Create Company
    // ---------------------------
    const organization_slug = await generateUniqueSlug(CompanyInfo, cname);

    const company = await CompanyInfo.create({
      organization_name: cname,
      organization_slug: organization_slug,  // save unique slug
      company_email: email,
      company_website: website,
      company_location: address,
      membership_plan: category == 1 ? elcina_member : null,
      company_logo: logo_id || null,
      user_category: category == 0 ? user_category : null,
    });

    // ---------------------------
    // 🔹 Step 5: Create User
    // ---------------------------
    const user = await Users.create({
      fname,
      lname,
      mobile,
      alternate_number,
      country_code,
      email,
      password: hashedPassword,
      real_password: otp,
      is_approve: 0,
      is_new: 1,
      is_profile: 1,
      is_trading: is_trading || 0,
      member_role: 1,
      is_email_verify: 1,
      file_id: logo_id || 0,
      elcina_member,
      is_seller: category,
      country,
      state,
      city,
      address,
      zipcode: pinCode,
      company_id: company.id,
      website: website ?? '',
      products: products ?? '',
      is_complete: category == 0 ? 1 : 0,
      status: 1,
      user_company: cname,
      step: 1,
      mode: 0,
      remember_token: '',
      payment_status: 0,
      featured_company: 0,
      is_intrest: 0,
      request_admin: 0,
    });

    if (category == 1) {
      const planId = elcina_member == 0 ? 5 : elcina_member;
      const planData = await MembershipPlan.findByPk(planId);

      if (planData) {
        const endDay = planData.expire_days || 30;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + endDay);

        await MembershipDetail.create({
          user: planData.user,
          used_user: 0,
          remaining_user: planData.user,
          category: planData.category,
          used_category: 0,
          remaining_category: planData.category,
          product: planData.product,
          used_product: 0,
          remaining_product: planData.product,
          company_id: company.id,
          plan_id: planId,
          start_date: startDate,
          end_date: endDate,
        });
      }
    }

    const { transporter, siteConfig, buildEmailHtml } = await getTransporter();

    const user_type = category == 1 ? 'Seller' : 'Buyer';
    const adminEmailTemplateId = 6;
    const adminEmailData = await Emails.findByPk(adminEmailTemplateId);
    let adminMessage = "";

    if (adminEmailData.message) {
      // longblob / buffer ko string me convert karo
      const msgStr = adminEmailData.message.toString('utf8');
      adminMessage = msgStr
        .replace("{{ ADMIN_NAME }}", siteConfig['title'])
        .replace("{{ USER_FNAME }}", `${fname} ${lname}`)
        .replace("{{ USER_EMAIL }}", email)
        .replace("{{ USER_TYPE }}", user_type)
        .replace("{{ USER_MOBILE }}", mobile);
    } else {
      adminMessage = `<p>New message from ${fname} ${lname}</p>`;
    }
    const htmlContent = await buildEmailHtml(adminMessage);
    const adminMailOptions = {
      from: `"Support Team" <info@sourceindia-electronics.com>`,
      to: siteConfig['site_email'],
      subject: adminEmailData.subject,
      html: htmlContent,
    };

    await transporter.sendMail(adminMailOptions);

    // user mail

    const userEmailTemplateId = 58;
    const userEmailData = await Emails.findByPk(userEmailTemplateId);
    let userMessage = "";
    if (userEmailData.message) {
      // longblob / buffer ko string me convert karo
      const usermsgStr = userEmailData.message.toString('utf8');
      userMessage = usermsgStr
        .replace("{{ USER_NAME }}", `${fname} ${lname}`)
        .replace("{{ USER_EMAIL }}", email)
        .replace("{{ USER_PASSWORD }}", otp);
    } else {
      userMessage = `<p>New message from ${fname} ${lname}</p>`;
    }

    const userMailOptions = {
      from: `"Support Team" <info@sourceindia-electronics.com>`,
      to: email,
      subject: userEmailData.subject,
      html: userMessage,
    };

    await transporter.sendMail(userMailOptions);

    return res.status(200).json({
      success: true,
      message: "Registration successful",
      user_id: user.id,
      company_id: company.id,
      password: otp, // send OTP for verification
    });
  } catch (err) {
    console.error("Registration Error:", err);
    return res.status(500).json({
      success: false,
      errors: { general: "Server error. Please try again later." },
    });
  }
};
// Get all countries
exports.getCountries = async (req, res) => {
  try {
    const { name } = req.query;
    let query = {};
    if (name) query = { name: name };
    const countries = await Countries.findAll({ where: query });

    return res.json(countries);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch countries' });
  }
};

// Get states by country_id or name
exports.getStates = async (req, res) => {
  try {
    const { country_id, name } = req.query;
    let query = {};
    if (country_id) query.country_id = country_id;
    if (name) query = { name: name };
    const states = await States.findAll({ where: query });
    // console.log(states);
    return res.json(states);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch states' });
  }
};

// Get cities by state_id or name
exports.getCities = async (req, res) => {
  try {
    const { state_id, name } = req.query;
    let query = {};
    if (state_id) query.state_id = state_id;
    if (name) query = { name: name };
    const cities = await Cities.findAll({ where: query });
    return res.json(cities);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch cities' });
  }
};

exports.sendLoginotp = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists and is not deleted
    const user = await Users.findOne({
      where: { email: email, is_delete: 0 },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check user status
    if (user.status === 0) {
      return res.status(400).json({ message: 'Your account is not active.' });
    }

    // Generate OTP
    const otp = Math.floor(1234 + Math.random() * (9999 - 1234 + 1)).toString(); // 4-digit OTP
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10-minute expiry

    // Store OTP in Users table
    await user.update({ otp, otp_expiry: otpExpiry });

    // Send OTP email
    const emailTemplate = await Emails.findByPk(87);
    if (!emailTemplate) {
      return res.status(404).json({ message: "Email template not found" });
    }
    const msgStr = emailTemplate.message.toString("utf8");
    const full_name = user.fname + ' ' + user.lname;
    const userMessage = msgStr
      .replace("{{ USER_FNAME }}", full_name)
      .replace("{{ OTP }}", otp);

    const { transporter, siteConfig, buildEmailHtml } = await getTransporter();
    const htmlContent = await buildEmailHtml(userMessage);

    await transporter.sendMail({
      from: `"Support Team" <info@sourceindia-electronics.com>`,
      to: email,
      subject: emailTemplate.subject,
      html: htmlContent,
    });

    return res.json({
      success: 1,
      message: 'OTP sent successfully',
      user: {
        id: user.id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        is_seller: user.is_seller,
      },
      userId: Buffer.from(user.id.toString()).toString('base64'), // Base64 user ID
    });
  } catch (error) {
    console.error('Error in sendLoginotp:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({ message: 'Database error' });
    } else if (error.code === 'EAUTH' || error.code === 'EENVELOPE') {
      return res.status(500).json({ message: 'Failed to send OTP email' });
    } else {
      return res.status(500).json({ message: 'Server error' });
    }
  }
};

exports.verifyLoginotp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }
    let user_id;
    try {
      user_id = Buffer.from(userId, 'base64').toString('ascii');
      if (!/^\d+$/.test(user_id)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const user = await Users.findOne({
      where: { id: user_id, is_delete: 0 },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    if (user.otp_expiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }
    await user.update({ otp: null, otp_expiry: null });
    const token = jwt.sign(
      { id: user.id, email: user.email, is_seller: user.is_seller },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '1h' }
    );
    return res.json({
      message: 'OTP verified successfully',
      token,
      user: {
        id: user.id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        is_seller: user.is_seller,
      },
    });
  } catch (error) {
    console.error('Error in verifyLoginotp:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({ message: 'Database error' });
    } else {
      return res.status(500).json({ message: 'Server error' });
    }
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await Users.findOne({
      where: { id: userId, is_delete: 0 },
      attributes: { exclude: ['password', 'real_password'] },
      include: [
        {
          model: CompanyInfo, as: 'company_info',
          where: { is_delete: 0 },
          required: false,
          include: [
            { model: UploadImage, as: 'companyLogo', required: false, attributes: ['file'] },
            { model: UploadImage, as: 'companySamplePptFile', required: false, attributes: ['file'] },
            { model: UploadImage, as: 'companyVideo', required: false, attributes: ['file'] },
            { model: UploadImage, as: 'companySampleFile', required: false, attributes: ['file'] },
            { model: CoreActivity, as: 'CoreActivity', required: false, attributes: ['id', 'name'] },
            { model: Activity, as: 'Activity', required: false, attributes: ['id', 'name'] }
          ]
        },
        { model: UploadImage, as: 'file', required: false, attributes: ['file'] },
        { model: UploadImage, as: 'company_file', required: false, attributes: ['file'] },
        { model: Countries, as: 'country_data', required: false, attributes: ['id', 'name'] },
        { model: States, as: 'state_data', required: false, attributes: ['id', 'name'] },
        { model: Cities, as: 'city_data', required: false, attributes: ['id', 'name'] }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.company_info) {
      const { category_sell, sub_category } = user.company_info;

      const sellerCategories = await SellerCategory.findAll({
        where: { user_id: user.id },
        attributes: ['category_id', 'subcategory_id'],
        raw: true, // return plain objects instead of Sequelize instances
      });

      // Extract all category_ids (unique)
      const categoryIds = [
        ...new Set(sellerCategories.map((item) => item.category_id).filter(Boolean))
      ];

      // Extract all subcategory_ids (unique, ignoring null)
      const subCategoryIds = [
        ...new Set(sellerCategories.map((item) => item.subcategory_id).filter(Boolean))
      ];

      // console.log('subCategoryIds ' + subCategoryIds);

      const parseIds = str => str ? str.split(',').map(id => parseInt(id.trim())).filter(Boolean) : [];

      const [categories, subCategories] = await Promise.all([
        categoryIds.length ? Categories.findAll({ where: { id: { [Op.in]: categoryIds } }, attributes: ['name'] }) : [],
        subCategoryIds.length ? SubCategories.findAll({ where: { id: { [Op.in]: subCategoryIds } }, attributes: ['name'] }) : []
      ]);




      user.company_info.dataValues.category_sell_names = categories.map(c => c.name).join(', ');
      user.company_info.dataValues.sub_category_names = subCategories.map(sc => sc.name).join(', ');
      const categoryIdsString = categoryIds.join(',');
      const subCategoryIdsString = subCategoryIds.join(',');

      // Assign to user.company_info.dataValues
      user.company_info.dataValues.sellerCategoryIds = categoryIdsString;
      user.company_info.dataValues.sellerSubCategoryIds = subCategoryIdsString;
    }
    res.json({ user });
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfileold = async (req, res) => {
  const upload = getMulterUpload('users');
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'company_logo', maxCount: 1 },
    { name: 'sample_file_id', maxCount: 1 },
    { name: 'company_sample_ppt_file', maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const userId = req.user.id;
      const user = await Users.findByPk(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const companyInfo = await CompanyInfo.findOne({ where: { id: user.company_id } });
      const updatedUserData = {
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        mobile: req.body.mobile,
        state: req.body.state,
        city: req.body.city,
        zipcode: req.body.zipcode,
        address: req.body.address,
        website: req.body.website
      };
      const profileImage = req.files?.file?.[0];
      if (profileImage) {
        const existingImage = await UploadImage.findByPk(user.file_id);
        if (existingImage) {
          const oldPath = path.resolve(existingImage.file);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          existingImage.file = `upload/users/${profileImage.filename}`;
          existingImage.updated_at = new Date();
          await existingImage.save();
        } else {
          const newImage = await UploadImage.create({
            file: `upload/users/${profileImage.filename}`
          });
          updatedUserData.file_id = newImage.id;
        }
      }
      await user.update(updatedUserData);

      const adminemailTemplate = await Emails.findByPk(32);
      if (!adminemailTemplate) {
        return res.status(404).json({ message: "Email template not found" });
      }
      const msgStr = adminemailTemplate.message.toString("utf8");
      let user_type = '';
      if (user.is_seller === 1) {
        user_type = 'Seller';
      } else {
        user_type = 'Buyer';
      }

      const { transporter, siteConfig, buildEmailHtml } = await getTransporter();
      const adminMessage = msgStr
        .replace("{{ ADMIN_NAME }}", siteConfig['title'])
        .replace("{{ USER_FNAME }}", user.fname)
        .replace("{{ USER_LNAME }}", user.lname)
        .replace("{{ USER_EMAIL }}", user.email)
        .replace("{{ USER_MOBILE }}", user.mobile)
        .replace("{{ USER_ADDRESS }}", user.address)
        .replace("{{ USER_TYPE }}", user_type);

      const htmlContent = await buildEmailHtml(adminMessage);

      await transporter.sendMail({
        from: `"Support Team" <info@sourceindia-electronics.com>`,
        to: siteConfig['site_email'],
        subject: adminemailTemplate.subject,
        html: htmlContent,
      });


      const emailTemplate = await Emails.findByPk(33);
      if (!emailTemplate) {
        return res.status(404).json({ message: "Email template not found" });
      }
      const usermsgStr = emailTemplate.message.toString("utf8");
      const subject = emailTemplate.subject.replace("{{ USER_FNAME }}", user.fname);
      const userMessage = usermsgStr
        .replace("{{ USER_FNAME }}", user.fname)
        .replace("{{ USER_LNAME }}", user.lname);

      await transporter.sendMail({
        from: `"Support Team" <info@sourceindia-electronics.com>`,
        to: user.email,
        subject: subject,
        html: userMessage,
      })

      if (companyInfo) {
        const companyLogo = req.files?.company_logo?.[0];
        if (companyLogo) {
          const existingLogo = await UploadImage.findByPk(companyInfo.company_logo);
          if (existingLogo) {
            const oldPath = path.resolve(existingLogo.file);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            existingLogo.file = `upload/users/${companyLogo.filename}`;
            existingLogo.updated_at = new Date();
            await existingLogo.save();
          } else {
            const newLogo = await UploadImage.create({
              file: `upload/users/${companyLogo.filename}`
            });
            await companyInfo.update({ company_logo: newLogo.id });
          }
        }
        const sampleFile = req.files?.sample_file_id?.[0];
        if (sampleFile) {
          const existingSample = await UploadImage.findByPk(companyInfo.sample_file_id);
          if (existingSample) {
            const oldPath = path.resolve(existingSample.file);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            existingSample.file = `upload/users/${sampleFile.filename}`;
            existingSample.updated_at = new Date();
            await existingSample.save();
          } else {
            const newSample = await UploadImage.create({
              file: `upload/users/${sampleFile.filename}`
            });
            await companyInfo.update({ sample_file_id: newSample.id });
          }
        }
        const pptFile = req.files?.company_sample_ppt_file?.[0];
        if (pptFile) {
          const existingPpt = await UploadImage.findByPk(companyInfo.company_sample_ppt_file);
          if (existingPpt) {
            const oldPath = path.resolve(existingPpt.file);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            existingPpt.file = `upload/users/${pptFile.filename}`;
            existingPpt.updated_at = new Date();
            await existingPpt.save();
          } else {
            const newPpt = await UploadImage.create({
              file: `upload/users/${pptFile.filename}`
            });
            await companyInfo.update({ company_sample_ppt_file: newPpt.id });
          }
        }

        // console.log(req.body.category_sell);
        // console.log(req.body.sub_category);
        await companyInfo.update({
          organization_name: req.body.organization_name,
          organization_slug: await generateUniqueSlug(CompanyInfo, req.body.organization_name),
          core_activity: req.body.core_activity,
          activity: req.body.activity,
          // category_sell: req.body.category_sell,
          // sub_category: req.body.sub_category,
          company_email: req.body.company_email,
          company_website: req.body.company_website,
          company_location: req.body.company_location,
          brief_company: req.body.brief_company,
          designation: req.body.designation,
          company_video_second: req.body.company_video_second,
          organizations_product_description: req.body.organizations_product_description,
          company_sample_ppt_file: req.body.company_sample_ppt_file,
          company_video_second: req.body.company_video_second
        });
        let { category_sell, sub_category } = req.body;

        if (typeof category_sell === 'string') {
          category_sell = category_sell.split(',').map(Number);
        }
        if (typeof sub_category === 'string') {
          sub_category = sub_category.split(',').map(Number);
        }

        // 1️⃣ Fetch all subcategories (with category_id)
        const subCategories = await SubCategories.findAll({
          where: { id: sub_category },
          attributes: ['id', 'category']
        });

        // 2️⃣ Prepare entries where subcategory exists
        const sellerCategoryData = subCategories.map((sub) => ({
          user_id: user.id,
          category_id: sub.category,
          subcategory_id: sub.id,
        }));

        // 3️⃣ Find categories that didn’t have any matching subcategory
        const categoriesWithSub = subCategories.map((sub) => sub.category_id);
        const categoriesWithoutSub = category_sell.filter(
          (catId) => !categoriesWithSub.includes(catId)
        );

        // 4️⃣ Add entries for categories without subcategory (subcategory_id = null)
        categoriesWithoutSub.forEach((catId) => {
          sellerCategoryData.push({
            user_id: user.id,
            category_id: catId,
            subcategory_id: null,
          });
        });

        // 5️⃣ Insert all data
        await SellerCategory.bulkCreate(sellerCategoryData, {
          ignoreDuplicates: true,
        });

      }
      return res.status(200).json({
        message: 'Profile updated successfully',
        user
      });
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return res.status(500).json({ error: error.message });
    }
  });
};


exports.updateProfile = async (req, res) => {
  const upload = getMulterUpload('users');
  let redirectToMyProduct = false;
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'company_logo', maxCount: 1 },
    { name: 'sample_file_id', maxCount: 1 },
    { name: 'company_sample_ppt_file', maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });

    try {
      const userId = req.user.id;
      const user = await Users.findByPk(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const companyInfo = await CompanyInfo.findOne({ where: { id: user.company_id } });

      const updatedUserData = {
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        mobile: req.body.mobile,
        alternate_number: req.body.alternate_number,
        state: req.body.state,
        city: req.body.city,
        zipcode: req.body.zipcode,
        address: req.body.address,
        website: req.body.website,
        products: req.body.products,
        walkin_buyer: 0
      };
      if (user.is_seller == 0) {
        await companyInfo.update({
          company_website: req.body.company_website,
          user_category: req.body.user_category,
        });
      }

      // Handle profile image update
      const profileImage = req.files?.file?.[0];
      if (profileImage) {
        const existingImage = await UploadImage.findByPk(user.file_id);
        if (existingImage) {
          const oldPath = path.resolve(existingImage.file);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          existingImage.file = `upload/users/${profileImage.filename}`;
          existingImage.updated_at = new Date();
          await existingImage.save();
        } else {
          const newImage = await UploadImage.create({
            file: `upload/users/${profileImage.filename}`,
          });
          updatedUserData.file_id = newImage.id;
        }
      }

      await user.update(updatedUserData);

      // Email notifications (admin + user)
      const adminemailTemplate = await Emails.findByPk(32);
      if (adminemailTemplate) {
        const msgStr = adminemailTemplate.message.toString('utf8');
        const { transporter, siteConfig, buildEmailHtml } = await getTransporter();


        const user_type = user.is_seller === 1 ? 'Seller' : 'Buyer';
        const adminMessage = msgStr
          .replace('{{ ADMIN_NAME }}', siteConfig['title'])
          .replace('{{ USER_FNAME }}', user.fname)
          .replace('{{ USER_LNAME }}', user.lname)
          .replace('{{ USER_EMAIL }}', user.email)
          .replace('{{ USER_MOBILE }}', user.mobile)
          .replace('{{ USER_ADDRESS }}', user.address)
          .replace('{{ USER_TYPE }}', user_type);

        const htmlContent = await buildEmailHtml(adminMessage);

        await transporter.sendMail({
          from: `"Support Team" <info@sourceindia-electronics.com>`,
          to: siteConfig['site_email'],
          subject: adminemailTemplate.subject,
          html: htmlContent,
        });
      }

      const emailTemplate = await Emails.findByPk(33);
      if (emailTemplate) {
        const { transporter, buildEmailHtml } = await getTransporter();

        const usermsgStr = emailTemplate.message.toString('utf8');
        const subject = emailTemplate.subject.replace('{{ USER_FNAME }}', user.fname);
        const userMessage = usermsgStr
          .replace('{{ USER_FNAME }}', user.fname)
          .replace('{{ USER_LNAME }}', user.lname);
        const htmlContent = await buildEmailHtml(userMessage);

        await transporter.sendMail({
          from: `"Support Team" <info@sourceindia-electronics.com>`,
          to: user.email,
          subject: subject,
          html: htmlContent,
        });
      }

      // 🏢 Company info + category handling
      if (companyInfo) {
        // Handle company logo, sample, ppt
        const companyLogo = req.files?.company_logo?.[0];
        const sampleFile = req.files?.sample_file_id?.[0];
        const pptFile = req.files?.company_sample_ppt_file?.[0];

        const handleFileUpdate = async (existingId, newFile, fieldName) => {
          if (!newFile) return null;
          const existingFile = existingId ? await UploadImage.findByPk(existingId) : null;
          if (existingFile) {
            const oldPath = path.resolve(existingFile.file);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            existingFile.file = `upload/users/${newFile.filename}`;
            existingFile.updated_at = new Date();
            await existingFile.save();
            return existingFile.id;
          } else {
            const created = await UploadImage.create({
              file: `upload/users/${newFile.filename}`,
            });
            await companyInfo.update({ [fieldName]: created.id });
            return created.id;
          }
        };

        await handleFileUpdate(companyInfo.company_logo, companyLogo, 'company_logo');
        await handleFileUpdate(companyInfo.sample_file_id, sampleFile, 'sample_file_id');
        await handleFileUpdate(companyInfo.company_sample_ppt_file, pptFile, 'company_sample_ppt_file');

        // 🧾 Update company info
        await companyInfo.update({
          organization_name: req.body.organization_name || companyInfo.organization_name,
          organization_slug: req.body.organization_name
            ? await generateUniqueSlug(CompanyInfo, req.body.organization_name)
            : companyInfo.organization_slug,
          core_activity: req.body.core_activity,
          activity: req.body.activity,
          company_email: req.body.company_email,
          company_website: req.body.company_website,
          company_location: req.body.company_location,
          brief_company: req.body.brief_company,
          designation: req.body.designation,
          company_video_second: req.body.company_video_second,
          organizations_product_description: req.body.organizations_product_description,
        });
        if (user.is_company === 0) {
          await user.update({ is_company: 1 });
          redirectToMyProduct = true;
        }

        // 🧩 Category/Subcategory Handling
        /*let { category_sell, sub_category } = req.body;

        if (typeof category_sell === 'string') category_sell = category_sell.split(',').map(Number);
        if (typeof sub_category === 'string') sub_category = sub_category.split(',').map(Number);

        // 1️⃣ Fetch all subcategories (with category_id)
        const subCategories = await SubCategories.findAll({
          where: { id: sub_category },
          attributes: ['id', 'category'],
        });

        // 2️⃣ Prepare entries where subcategory exists
        const sellerCategoryData = subCategories.map((sub) => ({
          user_id: user.id,
          category_id: sub.category,
          subcategory_id: sub.id,
        }));

        // 3️⃣ Find categories that didn’t have subcategory
        const categoriesWithSub = subCategories.map((sub) => sub.category);
        const categoriesWithoutSub = category_sell.filter(
          (catId) => !categoriesWithSub.includes(catId)
        );

        // 4️⃣ Add entries with null subcategory
        categoriesWithoutSub.forEach((catId) => {
          sellerCategoryData.push({
            user_id: user.id,
            category_id: catId,
            subcategory_id: null,
          });
        });

        // 5️⃣ Remove existing entries for this user, insert fresh clean data
        await SellerCategory.destroy({ where: { user_id: user.id } });
        await SellerCategory.bulkCreate(sellerCategoryData);*/
        if (req.body.categories !== undefined || req.body.subcategory_ids !== undefined) {

          let categoryIds = [];
          let subcategoryIds = [];

          if (req.body.categories) {
            categoryIds = req.body.categories.split(',').map(id => parseInt(id.trim()));
          }

          if (req.body.subcategory_ids) {
            subcategoryIds = req.body.subcategory_ids.split(',').map(id => parseInt(id.trim()));
          }

          // ---------- SAFE because both are arrays now ----------
          const existingCategories = await SellerCategory.findAll({ where: { user_id: userId } });
          const existingCategoryMap = existingCategories.map(c => `${c.category_id}-${c.subcategory_id ?? 'null'}`);
          const incomingCategoryMap = [];

          // ADD categories
          for (const categoryId of categoryIds) {
            const key = `${categoryId}-null`;
            incomingCategoryMap.push(key);
            if (!existingCategoryMap.includes(key)) {
              await SellerCategory.create({ user_id: userId, category_id: categoryId, subcategory_id: null });
            }
          }

          // ADD subcategories
          for (const subcategoryId of subcategoryIds) {
            const subCategory = await SubCategories.findOne({ where: { id: subcategoryId, is_delete: 0 } });
            if (subCategory) {
              const categoryId = subCategory.category;
              const key = `${categoryId}-${subcategoryId}`;
              incomingCategoryMap.push(key);
              if (!existingCategoryMap.includes(key)) {
                await SellerCategory.create({ user_id: userId, category_id: categoryId, subcategory_id: subcategoryId });
              }
            }
          }

          // REMOVE only categories that are missing
          const nullSubcategoryRows = await SellerCategory.findAll({
            where: { user_id: userId, subcategory_id: null },
          });

          for (const existing of nullSubcategoryRows) {
            const categoryId = existing.category_id;
            if (!incomingCategoryMap.includes(`${categoryId}-null`)) {
              await SellerCategory.destroy({
                where: { user_id: userId, category_id: categoryId, subcategory_id: null },
              });
            }
          }
        }
      }

      return res.status(200).json({
        message: 'Profile updated successfully',
        user,
        redirectToMyProduct,
      });
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return res.status(500).json({ error: error.message });
    }
  });
};


exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user.id;
  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'New password and confirm password do not match.' });
  }
  try {
    const user = await Users.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Old password is incorrect.' });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();
    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.getuserEnquiriesCount = async (req, res) => {
  try {
    const total = await OpenEnquriy.count();
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const sellers = await Users.findAll({
      where: {},
      order: [['id', 'ASC']],
      include: [
        { model: Countries, as: 'country_data', attributes: ['id', 'name'] },
        { model: States, as: 'state_data', attributes: ['id', 'name'] },
        { model: Cities, as: 'city_data', attributes: ['id', 'name'] },
        {
          model: CompanyInfo,
          as: 'company_info',
          attributes: ['id', 'organization_name', 'designation', 'company_website', 'company_email', 'organization_quality_certification'],
          include: [
            { model: MembershipPlan, as: 'MembershipPlan', attributes: ['id', 'name'] },
            { model: CoreActivity, as: 'CoreActivity', attributes: ['id', 'name'] },
            { model: Activity, as: 'Activity', attributes: ['id', 'name'] },
          ]
        }
      ]
    });

    const modifiedSellers = sellers.map(seller => {
      const s = seller.toJSON();

      // Map categories & subcategories
      const categoryNames = s.seller_categories
        ? Array.from(new Set(s.seller_categories.map(sc => sc.category?.name).filter(Boolean))).join(', ')
        : 'NA';

      const subCategoryNames = s.seller_categories
        ? Array.from(new Set(s.seller_categories.map(sc => sc.subcategory?.name).filter(Boolean))).join(', ')
        : 'NA';

      return {
        ...s,
        getStatus: s.status === 1 ? 'Active' : 'Inactive',
        getApproved: s.is_approve === 1 ? 'Approved' : 'Not Approved',
        getUserStatus: s.is_seller === 1 ? 'Seller' : 'Buyer',
        country_name: s.country_data?.name || 'NA',
        state_name: s.state_data?.name || 'NA',
        city_name: s.city_data?.name || 'NA',
        company_name: s.company_info?.organization_name || null,
        designation: s.company_info?.designation || null,
        company_website: s.company_info?.company_website || null,
        company_email: s.company_info?.company_email || null,
        membership_plan_name: s.company_info?.MembershipPlan?.name || 'NA',
        coreactivity_name: s.company_info?.CoreActivity?.name || 'NA',
        activity_name: s.company_info?.Activity?.name || 'NA',
        quality_certification: s.company_info?.organization_quality_certification || null,
        category_names: categoryNames,
        sub_category_names: subCategoryNames,
      };
    });

    res.json(modifiedSellers);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUsersHistoriesServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
      dateRange = '',
      startDate,
      endDate,
      customerId,
      firstName,
      lastName,
      mobile,
      step,
      country,
      state,
      city,
      organizationName,
      email
    } = req.query;

    // ✅ Valid sortable columns
    const validColumns = [
      'id', 'created_at', 'updated_at', 'organization_name', 'fname', 'lname',
      'email', 'mobile', 'status', 'is_seller', 'elcina_member', 'country', 'state', 'city', 'country_name', 'state_name', 'city_name'
    ];

    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);

    // ✅ Sorting logic
    let order = [];
    if (sortBy === 'full_name') {
      order = [[fn('concat', col('fname'), ' ', col('lname')), sortDirection]];
    } else if (sortBy === 'country_name') {
      order = [[{ model: Countries, as: 'country_data' }, 'name', sortDirection]];
    } else if (sortBy === 'state_name') {
      order = [[{ model: States, as: 'state_data' }, 'name', sortDirection]];
    } else if (sortBy === 'city_name') {
      order = [[{ model: Cities, as: 'city_data' }, 'name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }

    // ✅ Base where filter
    const where = {};

    if (customerId) where.id = { [Op.like]: `%${customerId}%` };
    if (firstName) where.fname = { [Op.like]: `%${firstName}%` };
    if (lastName) where.lname = { [Op.like]: `%${lastName}%` };
    if (mobile) where.mobile = { [Op.like]: `%${mobile}%` };
    if (step) where.step = step;
    if (country) where.country = country;
    if (state) where.state = state;
    if (city) where.city = city;
    if (organizationName) where['$company_info.organization_name$'] = { [Op.like]: `%${organizationName}%` };
    if (email) where.email = { [Op.like]: `%${email}%` };

    // ✅ Search filter (on flattened fields)
    if (search) {
      where[Op.or] = [
        Sequelize.where(fn('concat', col('fname'), ' ', col('lname')), { [Op.like]: `%${search}%` }),
        { email: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
        { '$company_info.organization_name$': { [Op.like]: `%${search}%` } },
        { country: { [Op.like]: `%${search}%` } },
        { state: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { '$country_data.name$': { [Op.like]: `%${search}%` } },
        { '$state_data.name$': { [Op.like]: `%${search}%` } },
        { '$city_data.name$': { [Op.like]: `%${search}%` } },
      ];
    }

    // ✅ Date filtering
    let dateCondition = null;
    if (dateRange) {
      const range = dateRange.toString().toLowerCase().replace(/\s+/g, '');
      const today = moment().startOf('day');
      const now = moment();

      if (range === 'today') {
        dateCondition = { [Op.gte]: today.toDate(), [Op.lte]: now.toDate() };
      } else if (range === 'yesterday') {
        dateCondition = {
          [Op.gte]: moment().subtract(1, 'day').startOf('day').toDate(),
          [Op.lte]: moment().subtract(1, 'day').endOf('day').toDate(),
        };
      } else if (range === 'last7days') {
        dateCondition = { [Op.gte]: moment().subtract(6, 'days').startOf('day').toDate(), [Op.lte]: now.toDate() };
      } else if (range === 'last30days') {
        dateCondition = { [Op.gte]: moment().subtract(29, 'days').startOf('day').toDate(), [Op.lte]: now.toDate() };
      } else if (range === 'thismonth') {
        dateCondition = { [Op.gte]: moment().startOf('month').toDate(), [Op.lte]: now.toDate() };
      } else if (range === 'lastmonth') {
        dateCondition = {
          [Op.gte]: moment().subtract(1, 'month').startOf('month').toDate(),
          [Op.lte]: moment().subtract(1, 'month').endOf('month').toDate(),
        };
      } else if (range === 'customrange' && startDate && endDate) {
        dateCondition = {
          [Op.gte]: moment(startDate).startOf('day').toDate(),
          [Op.lte]: moment(endDate).endOf('day').toDate(),
        };
      } else if (!isNaN(range)) {
        const days = parseInt(range);
        dateCondition = { [Op.gte]: moment().subtract(days - 1, 'days').startOf('day').toDate(), [Op.lte]: now.toDate() };
      }
    }

    if (dateCondition) where.created_at = dateCondition;

    // ✅ Query the Users table directly
    const totalRecords = await Users.count();

    const { count: filteredRecords, rows } = await Users.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [
        {
          model: CompanyInfo,
          as: 'company_info',
          attributes: ['organization_name', 'organization_slug'],
          required: false,
        },
        { model: Countries, as: 'country_data', attributes: ['id', 'name'] },
        { model: States, as: 'state_data', attributes: ['id', 'name'] },
        { model: Cities, as: 'city_data', attributes: ['id', 'name'] },
      ],
    });

    // ✅ Map rows for cleaner frontend response
    const mappedRows = rows.map((row) => ({
      id: row.id,
      full_name: `${row.fname} ${row.lname}`,
      email: row.email,
      mobile: row.mobile,
      organization_name: row.company_info?.organization_name || null,
      organization_slug: row.company_info?.organization_slug || null,
      country: row.country,
      state: row.state,
      city: row.city,
      country_name: row.country_data ? row.country_data.name : null,
      state_name: row.state_data ? row.state_data.name : null,
      city_name: row.city_data ? row.city_data.name : null,
      elcina_member: row.elcina_member,
      is_seller: row.is_seller,
      step: row.step,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    res.json({
      data: mappedRows,
      totalRecords,
      filteredRecords,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateUsersStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }
    const users = await Users.findByPk(req.params.id);
    if (!users) return res.status(404).json({ message: 'Users not found' });
    users.status = status;
    await users.save();
    res.json({ message: 'Status updated', users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.impersonateLogin = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "UserId is required" });
    }
    const user = await Users.findOne({
      where: { id: userId, is_delete: 0 }
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        is_seller: user.is_seller,
        impersonated: true
      },
      "your_jwt_secret_key",
      { expiresIn: "1h" }
    );
    return res.json({
      message: "Impersonation token generated",
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getUsersCount = async (req, res) => {
  try {
    const total = await Users.count();
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Forgot Password API
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    // Check if user exists
    const user = await Users.findOne({ where: { email, is_delete: 0 } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Generate OTP or token (for demo, using 6-digit OTP)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    await user.update({ otp, otp_expiry: otpExpiry });
    // Prepare email
    const emailTemplate = await Emails.findByPk(100); // Use your forgot password template ID
    let msgStr = emailTemplate ? emailTemplate.message.toString('utf8') : 'Your OTP is {{ OTP }}';
    const full_name = user.fname + ' ' + user.lname;
    const userMessage = msgStr.replace('{{ USER_FNAME }}', full_name).replace('{{ OTP }}', otp);
    const { transporter, buildEmailHtml } = await getTransporter();
    const htmlContent = await buildEmailHtml(userMessage);
    await transporter.sendMail({
      from: 'info@sourceindia-electronics.com',
      to: email,
      subject: emailTemplate ? emailTemplate.subject : 'Password Reset OTP',
      html: htmlContent,
    });
    return res.json({ message: 'Check your email for reset instructions' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Failed to send reset email' });
  }
};
// Reset Password after OTP verification
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }
    const user = await Users.findOne({ where: { email, is_delete: 0 } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    user.real_password = newPassword;
    await user.save();
    return res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};
// Verify Forgot Password OTP
exports.verifyForgotOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
    const user = await Users.findOne({ where: { email, is_delete: 0 } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    if (user.otp_expiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }
    // Mark OTP as used (optional: clear it)
    await user.update({ otp: null, otp_expiry: null });
    // You can return a token or just success
    return res.json({ message: 'OTP verified successfully', email });
  } catch (error) {
    console.error('Error in verifyForgotOtp:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};