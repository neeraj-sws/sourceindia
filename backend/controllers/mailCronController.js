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
const crypto = require('crypto');

const getTrackingBaseUrl = () => {
  const root = (process.env.ROOT_URL || process.env.APP_URL || 'http://localhost:5000').replace(/\/$/, '');
  const apiBasePath = (process.env.API_BASE_PATH || '/v2').trim();
  if (!apiBasePath || apiBasePath === '/') return root;
  const normalizedApiBasePath = apiBasePath.startsWith('/') ? apiBasePath : `/${apiBasePath}`;
  return root.endsWith(normalizedApiBasePath) ? root : `${root}${normalizedApiBasePath}`;
};

const appendTrackingPixel = (html, token) => {
  if (!html || !token) return html || '';
  const trackingUrl = `${getTrackingBaseUrl()}/api/seller_mail_histories/track-open/${encodeURIComponent(token)}`;
  const pixelTag = `<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />`;
  return `${html}${pixelTag}`;
};

const getMailFailureReason = (err) => {
  // Build a concise server-side reason (SMTP/auth/network/db) for storing in DB.
  const parts = [];

  if (err?.response) parts.push(`SMTP response: ${err.response}`);
  if (err?.responseCode) parts.push(`SMTP code: ${err.responseCode}`);
  if (err?.code) parts.push(`Error code: ${err.code}`);
  if (err?.command) parts.push(`SMTP command: ${err.command}`);
  if (err?.errno) parts.push(`Errno: ${err.errno}`);
  if (err?.parent?.sqlMessage) parts.push(`SQL: ${err.parent.sqlMessage}`);
  if (err?.message) parts.push(`Message: ${err.message}`);

  const reason = parts.join(" | ");
  if (!reason) return "Mail send failed due to unknown server error";

  // Keep reason bounded in case DB column is VARCHAR(255).
  return reason.length > 500 ? `${reason.slice(0, 497)}...` : reason;
};


exports.sendMailold = async (req, res) => {
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

        const msgStr = template.message.toString("utf8");
        const openToken = seller.open_token || crypto.randomBytes(24).toString('hex');
        if (!seller.open_token) {
          await SellerMailHistories.update(
            { open_token: openToken },
            {
              where: {
                seller_mail_history_id: seller.seller_mail_history_id
              }
            }
          );
        }

        const userMessage = appendTrackingPixel(
          msgStr
            .replace("{{ USER_NAME }}", `${seller.fname || ""} ${seller.lname || ""}`)
            .replace("{{ USER_EMAIL }}", seller.email || "")
            .replace("{{ USER_PASSWORD }}", seller.real_password || "")
            .replace("{{ APP_URL }}", APP_URL)
            .replace("{{ VERIFICATION_LINK }}", verification_link),
          openToken
        );


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


exports.sendMail = async (req, res) => {
  try {

    const sellers = await sequelize.query(`
      SELECT smh.*, u.*
      FROM seller_mail_histories smh
      LEFT JOIN users u ON u.user_id = smh.user_id
      WHERE smh.status = 1
        AND smh.is_sent = 0
        AND smh.is_failed = 0
        `, {
      type: sequelize.QueryTypes.SELECT
    });


    if (sellers.length === 0) {
      return res.json({
        status: true,
        message: "No pending emails"
      });
    }

    const failedMails = [];
    let sentCount = 0;

    for (const seller of sellers) {

      console.log("--------------------------------");
      console.log("Processing User:", seller.user_id);
      console.log("Email:", seller.email || seller.email);

      try {

        console.log("Finding Template:", seller.email_id);

        const template = await Emails.findOne({
          where: {
            id: seller.email_id,
            is_seller_direct: 1
          }
        });

        console.log("Template Result:", template ? "FOUND" : "NOT FOUND");

        if (!template) {

          const templateReason = "Template not found for this email_id";

          await SellerMailHistories.update(
            {
              is_sent: 0,
              is_failed: 1,
              reason: templateReason,
              updated_at: new Date()
            },
            {
              where: {
                seller_mail_history_id: seller.seller_mail_history_id
              }
            }
          );

          console.log("Template Missing -> Marked Failed");

          failedMails.push({
            seller_mail_history_id: seller.seller_mail_history_id,
            user_id: seller.user_id,
            email: seller.email || null,
            reason: templateReason
          });

          continue;
        }

        const APP_URL = process.env.APP_URL;

        const verification_link = `
          <a href="${APP_URL}">
            Click and Login Account
          </a>
        `;

        console.log("Building Email Body");

        const msgStr = template.message.toString("utf8");

        const openToken = seller.open_token || crypto.randomBytes(24).toString('hex');
        if (!seller.open_token) {
          await SellerMailHistories.update(
            { open_token: openToken },
            {
              where: {
                seller_mail_history_id: seller.seller_mail_history_id
              }
            }
          );
        }

        const userMessage = appendTrackingPixel(
          msgStr
            .replace("{{ USER_NAME }}", `${seller.fname || ""} ${seller.lname || ""}`)
            .replace("{{ USER_EMAIL }}", seller.email || "")
            .replace("{{ USER_PASSWORD }}", seller.real_password || "")
            .replace("{{ APP_URL }}", APP_URL)
            .replace("{{ VERIFICATION_LINK }}", verification_link),
          openToken
        );

        console.log("Sending Email To:", seller.email || seller.email);

        await sendMail({
          to: seller.email || seller.email,
          subject: template.subject,
          message: userMessage
        });

        console.log("Email Sent Successfully");

        const updateResult = await SellerMailHistories.update(
          {
            is_sent: 1,
            is_failed: 0,
            reason: null,
            updated_at: new Date()
          },
          {
            where: {
              seller_mail_history_id: seller.seller_mail_history_id
            }
          }
        );

        console.log("History Updated:", updateResult);
        sentCount += 1;

      } catch (err) {

        const failureReason = getMailFailureReason(err);


        if (err.parent) {
          console.log("SQL MESSAGE:", err.parent.sqlMessage);
          console.log("SQL CODE:", err.parent.code);
        }

        console.log("MAIL SEND ERROR:", failureReason);

        await SellerMailHistories.update(
          {
            is_sent: 0,
            is_failed: 1,
            reason: failureReason,
            updated_at: new Date()
          },
          {
            where: {
              seller_mail_history_id: seller.seller_mail_history_id
            }
          }
        );

        failedMails.push({
          seller_mail_history_id: seller.seller_mail_history_id,
          user_id: seller.user_id,
          email: seller.email || null,
          reason: failureReason
        });

      }
    }

    console.log("===== EMAIL PROCESS COMPLETED =====");

    const failedCount = failedMails.length;
    const totalCount = sellers.length;
    const success = failedCount === 0;

    return res.json({
      status: success,
      message: success ? "Batch processed successfully!" : "Batch processed with failures",
      summary: {
        total: totalCount,
        sent: sentCount,
        failed: failedCount
      },
      failures: failedMails
    });

  } catch (error) {

    console.log("===== OUTER ERROR =====");
    console.log("MESSAGE:", error.message);
    console.log("STACK:", error.stack);

    if (error.parent) {
      console.log("SQL MESSAGE:", error.parent.sqlMessage);
      console.log("SQL CODE:", error.parent.code);
      console.log("SQL:", error.sql);
    }

    return res.status(500).json({
      status: false,
      message: error.message
    });
  }
};
