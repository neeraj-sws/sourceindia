const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ where: { email } });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (admin.role !== 1) {
      return res.status(403).json({ message: 'Access denied. Not authorized.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      'your_jwt_secret', // Replace with environment variable in production
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'Login successful.',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { login };

const changePassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const adminId = req.user.id;
  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'New password and confirm password do not match.' });
  }
  try {
    const admin = await Admin.findByPk(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Old password is incorrect.' });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedNewPassword;
    await admin.save();
    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { login, changePassword };