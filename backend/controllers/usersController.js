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
const { getTransporter } = require('../helpers/mailHelper');
const { generateUniqueSlug  } = require('../helpers/mailHelper');
const getMulterUpload = require('../utils/upload');
const nodemailer = require('nodemailer');
const secretKey = 'your_secret_key';
const jwt = require('jsonwebtoken');

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
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, is_seller: user.is_seller }, 'your_jwt_secret_key', {
      expiresIn: '1h',
    });
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
  try {
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


    const { transporter, siteConfig } = await getTransporter();
    await transporter.sendMail({
      from: `"OTP Verification" <info@sourceindia-electronics.com>`,
      to: email,
      subject: emailTemplate?.subject || "Verify your email",
      html: userMessage,
    });

    return res.json({ message: "OTP sent successfully", user_id: emailRecord.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
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

    const { transporter, siteConfig } = await getTransporter();


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

    const adminMailOptions = {

      to: siteConfig['site_email'],
      subject: adminEmailData.subject,
      html: adminMessage,
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
      from: `<${email}>`,
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

    const { transporter, siteConfig } = await getTransporter();

    await transporter.sendMail({
      from: `"Support Team" <info@sourceindia-electronics.com>`,
      to: email,
      subject: emailTemplate.subject,
      html: userMessage,
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
          model: CompanyInfo,
          as: 'company_info',
          where: { is_delete: 0 },
          required: false,
          include: [
            {
              model: UploadImage,
              as: 'companyLogo',
              required: false,
              attributes: ['file']
            },
            {
              model: UploadImage,
              as: 'companySamplePptFile',
              required: false,
              attributes: ['file']
            },
            {
              model: UploadImage,
              as: 'companyVideo',
              required: false,
              attributes: ['file']
            },
            {
              model: UploadImage,
              as: 'companySampleFile',
              required: false,
              attributes: ['file']
            },
            {
              model: CoreActivity,
              as: 'CoreActivity',
              required: false,
              attributes: ['id', 'name']
            },
            {
              model: Activity,
              as: 'Activity',
              required: false,
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: UploadImage,
          as: 'file',
          required: false,
          attributes: ['file']
        },
        {
          model: UploadImage,
          as: 'company_file',
          required: false,
          attributes: ['file']
        },
        {
          model: Countries,
          as: 'country_data',
          required: false,
          attributes: ['id', 'name']
        },
        {
          model: States,
          as: 'state_data',
          required: false,
          attributes: ['id', 'name']
        },
        {
          model: Cities,
          as: 'city_data',
          required: false,
          attributes: ['id', 'name']
        }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.company_info) {
      const { category_sell, sub_category } = user.company_info;
      const parseIds = str => str ? str.split(',').map(id => parseInt(id.trim())).filter(Boolean) : [];
      const categoryIds = parseIds(category_sell);
      const subCategoryIds = parseIds(sub_category);
      const [categories, subCategories] = await Promise.all([
        categoryIds.length ? Categories.findAll({ where: { id: { [Op.in]: categoryIds } }, attributes: ['name'] }) : [],
        subCategoryIds.length ? SubCategories.findAll({ where: { id: { [Op.in]: subCategoryIds } }, attributes: ['name'] }) : []
      ]);
      user.company_info.dataValues.category_sell_names = categories.map(c => c.name).join(', ');
      user.company_info.dataValues.sub_category_names = subCategories.map(sc => sc.name).join(', ');
    }
    res.json({ user });
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
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
        await companyInfo.update({
          organization_name: req.body.organization_name,
          organization_slug: generateUniqueSlug(req.body.organization_slug || req.body.organization_name),
          core_activity: req.body.core_activity,
          activity: req.body.activity,
          category_sell: req.body.category_sell,
          sub_category: req.body.sub_category,
          company_website: req.body.company_website,
          company_location: req.body.company_location,
          organizations_product_description: req.body.organizations_product_description,
          company_sample_ppt_file: req.body.company_sample_ppt_file,
          company_video_second: req.body.company_video_second
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
