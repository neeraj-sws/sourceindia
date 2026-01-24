// Script to insert forgot password email template (ID 88) into Emails table using Sequelize
const Emails = require('../models/Emails');

async function insertForgotPasswordTemplate() {
    try {
        await Emails.create({
            id: 100,
            title: 'Forgot Password',
            email_for: 'forgot-password',
            description: 'Template for user forgot password OTP email',
            subject: 'Reset Your Password - SourceIndia Electronics',
            is_seller_direct: 0,
            message: `<p>Dear {{ USER_FNAME }},</p>\n<p>We received a request to reset your password. Please use the following OTP to reset your password:</p>\n<h2>{{ OTP }}</h2>\n<p>This OTP is valid for 10 minutes. If you did not request a password reset, please ignore this email.</p>\n<p>Thank you,<br/>SourceIndia Electronics Team</p>`,
            status: 1
        });
        console.log('Forgot password template inserted successfully!');
    } catch (err) {
        console.error('Error inserting template:', err);
    }
}

insertForgotPasswordTemplate();
