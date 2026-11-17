const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op, fn, col, where } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('../models/Users');
const Emails = require('../models/Emails');
const EmailChangeRequest = require('../models/EmailChangeRequest');
const { sendMail } = require('../helpers/mailHelper');

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const OTP_TEMPLATE_ID = 125;
const CHANGED_TEMPLATE_ID = 126;

async function sendTemplate(templateId, to, replacements) {
  const template = await Emails.findByPk(templateId);
  if (!template) throw new Error(`Email template ${templateId} is not installed`);

  let message = template.message.toString('utf8');
  for (const [key, value] of Object.entries(replacements)) {
    const token = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    message = message.replace(token, String(value));
  }

  return sendMail({ to, subject: template.subject, message });
}

function createOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

async function getLatestRequest(userId, transaction) {
  return EmailChangeRequest.findOne({
    where: { user_id: userId },
    order: [['created_at', 'DESC'], ['id', 'DESC']],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
}

function cooldownRemaining(request) {
  if (!request?.last_sent_at) return 0;
  return Math.max(0, RESEND_COOLDOWN_MS - (Date.now() - new Date(request.last_sent_at).getTime()));
}

async function isEmailInUse(email, excludedUserId, transaction) {
  const existing = await Users.findOne({
    where: {
      id: { [Op.ne]: excludedUserId },
      [Op.and]: [where(fn('LOWER', col('email')), email)],
    },
    attributes: ['id'],
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });
  return Boolean(existing);
}

exports.sendOldOtp = async (req, res) => {
  try {
    const transaction = await sequelize.transaction();
    let user;
    let request;
    let otp;
    try {
      user = await Users.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!user || !user.email) {
        await transaction.rollback();
        return res.status(404).json({ message: 'User email not found' });
      }

      const latest = await getLatestRequest(user.id, transaction);
      const waitMs = cooldownRemaining(latest);
      if (waitMs > 0) {
        await transaction.rollback();
        return res.status(429).json({ message: 'Please wait before requesting another OTP', retry_after_seconds: Math.ceil(waitMs / 1000) });
      }

      await EmailChangeRequest.update(
        { status: 'expired' },
        { where: { user_id: user.id, status: { [Op.in]: ['pending', 'old_verified'] } }, transaction }
      );

      otp = createOtp();
      request = await EmailChangeRequest.create({
        user_id: user.id,
        old_email: user.email,
        old_otp_hash: await bcrypt.hash(otp, 10),
        old_otp_expires_at: new Date(Date.now() + OTP_TTL_MS),
        attempts_old: 0,
        last_sent_at: new Date(),
        status: 'pending',
      }, { transaction });
      await transaction.commit();
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      console.error('sendOldOtp transaction error:', error.message, error.stack);
      throw error;
    }

    try {
      await sendTemplate(OTP_TEMPLATE_ID, user.email, { OTP: otp, PURPOSE: 'current email verification' });
    } catch (error) {
      console.error('sendOldOtp mail error:', error.message, error.stack);
      await request.update({
        status: 'expired',
        old_otp_hash: null,
        old_otp_expires_at: null,
        last_sent_at: null,
      });
      throw error;
    }
    return res.json({ message: 'A verification OTP was sent to your current email' });
  } catch (error) {
    console.error('sendOldOtp error:', error.message, error.stack);
    return res.status(500).json({ message: 'Failed to send verification email' });
  }
};

exports.verifyOldOtp = async (req, res) => {
  let transaction;
  try {
    const { otp } = req.body;
    if (!/^\d{6}$/.test(String(otp || ''))) return res.status(400).json({ message: 'Enter the 6-digit OTP' });

    transaction = await sequelize.transaction();
    const request = await getLatestRequest(req.user.id, transaction);
    if (!request || request.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Start email verification first' });
    }
    if (!request.old_otp_expires_at || new Date(request.old_otp_expires_at) <= new Date()) {
      await request.update({ status: 'expired', old_otp_hash: null }, { transaction });
      await transaction.commit();
      return res.status(400).json({ message: 'OTP has expired. Start email verification again' });
    }
    if (request.attempts_old >= MAX_ATTEMPTS) {
      await request.update({ status: 'expired', old_otp_hash: null }, { transaction });
      await transaction.commit();
      return res.status(429).json({ message: 'Too many attempts. Start email verification again' });
    }

    const matches = await bcrypt.compare(String(otp), request.old_otp_hash || '');
    if (!matches) {
      const attempts = request.attempts_old + 1;
      await request.update({ attempts_old: attempts, ...(attempts >= MAX_ATTEMPTS ? { status: 'expired', old_otp_hash: null } : {}) }, { transaction });
      await transaction.commit();
      return res.status(attempts >= MAX_ATTEMPTS ? 429 : 400).json({
        message: attempts >= MAX_ATTEMPTS ? 'Too many attempts. Start email verification again' : 'Invalid OTP',
        attempts_remaining: Math.max(0, MAX_ATTEMPTS - attempts),
      });
    }

    await request.update({ status: 'old_verified', old_verified_at: new Date(), old_otp_hash: null, last_sent_at: null }, { transaction });
    await transaction.commit();
    return res.json({ message: 'Current email verified' });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    console.error('verifyOldOtp error:', error.message, error.stack);
    return res.status(500).json({ message: 'Could not verify OTP' });
  }
};

exports.sendNewOtp = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const user = await Users.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: 'User not found' });
    }
    const email = String(req.body.new_email || '').trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Enter a valid email address' });
    }
    if (email === String(user.email || '').trim().toLowerCase()) {
      await transaction.rollback();
      return res.status(400).json({ message: 'New email must differ from your current email' });
    }
    if (await isEmailInUse(email, user.id, transaction)) {
      await transaction.rollback();
      return res.status(409).json({ message: 'That email is already in use' });
    }

    const request = await getLatestRequest(user.id, transaction);
    if (!request || request.status !== 'old_verified') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Verify your current email first' });
    }
    const waitMs = cooldownRemaining(request);
    if (waitMs > 0) {
      await transaction.rollback();
      return res.status(429).json({ message: 'Please wait before requesting another OTP', retry_after_seconds: Math.ceil(waitMs / 1000) });
    }

    const otp = createOtp();
    await request.update({
      new_email: email,
      new_otp_hash: await bcrypt.hash(otp, 10),
      new_otp_expires_at: new Date(Date.now() + OTP_TTL_MS),
      new_verified_at: null,
      attempts_new: 0,
      last_sent_at: new Date(),
    }, { transaction });
    await transaction.commit();
    try {
      await sendTemplate(OTP_TEMPLATE_ID, email, { OTP: otp, PURPOSE: 'new email verification' });
    } catch (error) {
      console.error('sendNewOtp mail error:', error.message, error.stack);
      await request.update({ new_otp_hash: null, new_otp_expires_at: null, last_sent_at: null });
      throw error;
    }
    return res.json({ message: 'A verification OTP was sent to your new email' });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    console.error('sendNewOtp error:', error.message, error.stack);
    return res.status(500).json({ message: 'Failed to send verification email' });
  }
};

exports.verifyNewOtp = async (req, res) => {
  let transaction;
  try {
    const { otp } = req.body;
    if (!/^\d{6}$/.test(String(otp || ''))) return res.status(400).json({ message: 'Enter the 6-digit OTP' });

    transaction = await sequelize.transaction();
    const request = await getLatestRequest(req.user.id, transaction);
    if (!request || request.status !== 'old_verified' || !request.new_email) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Verify your current email and request a new-email OTP first' });
    }
    if (!request.new_otp_expires_at || new Date(request.new_otp_expires_at) <= new Date()) {
      await request.update({ new_otp_hash: null, new_otp_expires_at: null }, { transaction });
      await transaction.commit();
      return res.status(400).json({ message: 'OTP has expired. Request another OTP' });
    }
    if (request.attempts_new >= MAX_ATTEMPTS) {
      await request.update({ new_otp_hash: null, new_otp_expires_at: null }, { transaction });
      await transaction.commit();
      return res.status(429).json({ message: 'Too many attempts. Request another OTP after the resend cooldown' });
    }

    const matches = await bcrypt.compare(String(otp), request.new_otp_hash || '');
    if (!matches) {
      const attempts = request.attempts_new + 1;
      await request.update({ attempts_new: attempts, ...(attempts >= MAX_ATTEMPTS ? { new_otp_hash: null, new_otp_expires_at: null } : {}) }, { transaction });
      await transaction.commit();
      return res.status(attempts >= MAX_ATTEMPTS ? 429 : 400).json({
        message: attempts >= MAX_ATTEMPTS ? 'Too many attempts. Request another OTP after the resend cooldown' : 'Invalid OTP',
        attempts_remaining: Math.max(0, MAX_ATTEMPTS - attempts),
      });
    }

    const lockedUser = await Users.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!lockedUser) {
      await transaction.rollback();
      return res.status(404).json({ message: 'User not found' });
    }
    if (lockedUser.email.toLowerCase() !== request.old_email.toLowerCase()) {
      await request.update({ status: 'expired', new_otp_hash: null }, { transaction });
      await transaction.commit();
      return res.status(400).json({ message: 'The current email changed. Start email verification again' });
    }
    const normalizedEmail = request.new_email.toLowerCase();
    if (await isEmailInUse(normalizedEmail, lockedUser.id, transaction)) {
      await transaction.rollback();
      return res.status(409).json({ message: 'That email is already in use' });
    }

    const oldEmail = lockedUser.email;
    await lockedUser.update({ email: normalizedEmail, token_version: Number(lockedUser.token_version || 0) + 1 }, { transaction });
    await request.update({ status: 'completed', new_verified_at: new Date(), new_otp_hash: null }, { transaction });
    await transaction.commit();

    try {
      await sendTemplate(CHANGED_TEMPLATE_ID, oldEmail, { OLD_EMAIL: oldEmail, NEW_EMAIL: request.new_email });
    } catch (error) {
      console.error('Email change notification failed:', error.message || error);
    }
    return res.json({ message: 'Email changed successfully. Please log in with your new email' });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'That email is already in use' });
    }
    console.error('verifyNewOtp error:', error.message, error.stack);
    return res.status(500).json({ message: 'Could not complete email change' });
  }
};
