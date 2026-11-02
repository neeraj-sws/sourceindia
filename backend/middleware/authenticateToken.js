const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token

  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  // Same secret as adminAuthController.login: the admin token is signed with
  // process.env.JWT_SECRET when set, falling back to the shared literal.
  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user; // user contains id, email, role from your login token
    next();
  });
};

module.exports = authenticateToken;
