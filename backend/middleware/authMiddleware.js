const jwt = require('jsonwebtoken');
const Users = require('../models/Users');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret_key');
    const user = await Users.findByPk(decoded.id, {
      attributes: ['id', 'token_version', 'is_delete'],
    });
    if (!user || user.is_delete === 1) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Tokens issued before token_version was added are treated as version 0.
    if ((decoded.token_version ?? 0) !== (user.token_version ?? 0)) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = decoded; // Add user data to the request
    next();
  } catch (err) {
    if (err.name === 'SequelizeDatabaseError' || err.name === 'SequelizeConnectionError') {
      return res.status(500).json({ message: 'Authentication check failed' });
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
