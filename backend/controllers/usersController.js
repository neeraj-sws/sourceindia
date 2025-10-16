const Sequelize = require('sequelize');
const { Op } = Sequelize;
const bcrypt = require('bcrypt');
const Users = require('../models/Users');
const Countries = require('../models/Countries');
const States = require('../models/States');
const Cities = require('../models/Cities');
const Emails = require('../models/Emails');
const EmailVerification = require('../models/EmailVerification');
const MembershipPlan = require('../models/MembershipPlan');
const Companyinfo = require('../models/CompanyInfo');
const MembershipDetail = require('../models/MembershipDetail');
const { getTransporter } = require('../helpers/mailHelper');
const { generateUniqueSlug  } = require('../helpers/mailHelper');

const nodemailer = require('nodemailer');

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
    const organization_slug = await generateUniqueSlug(Companyinfo, cname);

    const company = await Companyinfo.create({
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
