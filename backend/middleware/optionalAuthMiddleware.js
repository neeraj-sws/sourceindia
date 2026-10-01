const jwt = require('jsonwebtoken');

const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    } catch (err) {
      req.user = undefined;
    }
  }

  next();
};

module.exports = optionalAuthMiddleware;