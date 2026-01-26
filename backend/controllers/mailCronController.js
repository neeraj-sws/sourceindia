const Sequelize = require('sequelize');
const moment = require('moment');
const { Op, fn, col } = Sequelize;
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
const Users = require('../models/Users');
const SellerMailHistories = require('../models/SellerMailHistories');
const Emails = require('../models/Emails');
const { getTransporter, sendMail } = require('../helpers/mailHelper');
const bcrypt = require('bcryptjs');


exports.sendMail = async (req, res) => {
  try {


    const sellers = await sequelize.query(`
      SELECT smh.*, u.*
      FROM seller_mail_histories smh
      LEFT JOIN users u ON u.user_id = smh.user_id
      WHERE smh.is_sent = 0
      LIMIT 25
    `, { type: sequelize.QueryTypes.SELECT });

    if (sellers.length === 0) {
      return res.json({ status: true, message: "No pending emails" });
    }

    console.log(`Processing ${sellers.length} emails...`);

    for (const seller of sellers) {
      try {
        const template = await Emails.findOne({
          where: {
            id: seller.email_id,
            is_seller_direct: 1
          }
        });

        if (!template) {
          console.log("Template not found for seller:", seller.user_id);
          await SellerMailHistories.update(
            { is_failed: 1 },
            { where: { seller_mail_history_id: seller.seller_mail_history_id } }
          );
          continue;
        }

        let verification_link = `<a class='back_to' href='/'  
          style='background: linear-gradient(90deg, rgb(248 143 66) 45%, #38a15a 100%);
          border: 1px solid transparent; padding: 4px 10px; font-size: 12px; 
          border-radius: 4px; color: #fff;'>
          Click and Login Account
        </a>`;

        const APP_URL = process.env.APP_URL;

        const msgStr = template.message.toString('utf8');

        let userMessage = msgStr
          .replace("{{ USER_NAME }}", `${seller.fname} ${seller.lname}`)
          .replace("{{ USER_EMAIL }}", seller.mail)
          .replace("{{ USER_PASSWORD }}", seller.real_password)
          .replace("{{ APP_URL }}", APP_URL)
          .replace("{{ VERIFICATION_LINK }}", verification_link);


        // Send Mail via centralized helper
        await sendMail({ to: seller.mail, subject: template?.subject, message: userMessage });

        await SellerMailHistories.update(
          { is_sent: 1, sent_at: new Date() },
          { where: { seller_mail_history_id: seller.seller_mail_history_id } }
        );



      } catch (err) {
        console.error("Mail error for user:", seller.user_id, err.message);

        await SellerMailHistories.update(
          { is_failed: 1 },
          { where: { seller_mail_history_id: seller.seller_mail_history_id } }
        );
      }
    }

    return res.json({ status: true, message: "Batch processed successfully!" });

  } catch (error) {
    console.error("Send mail error:", error);
    return res.status(500).json({ status: false, message: "Internal error" });
  }
};

