const jwt = require('jsonwebtoken');

// Attach a verified user when a valid bearer token is present; public requests continue either way.
const optionalAuth = (req, res, next) => {
  const visitorId = req.get('X-Visitor-Id');
  if (typeof visitorId === 'string' && /^[A-Za-z0-9_-]{1,255}$/.test(visitorId.trim())) {
    req.visitorId = visitorId.trim();
  }
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) return next();

  // Front-site login controllers sign with JWT_SECRET (falling back to the shared
  // secret): customer/seller password login, customer OTP login, seller impersonation
  // and enquiry verification. All of them put the users.user_id into `id`; password,
  // OTP and impersonation payloads also carry `is_seller`, while the enquiry payload
  // only carries `id`/`email`.
  const secrets = [...new Set([process.env.JWT_SECRET, 'your_jwt_secret_key'].filter(Boolean))];
  for (const secret of secrets) {
    try {
      const user = jwt.verify(token, secret);
      // Admin tokens can share the configured secret in some deployments but do not
      // represent a row in users: they carry a `role` claim and no `is_seller` claim.
      const isAdminPayload = Object.prototype.hasOwnProperty.call(user, 'role')
        && !Object.prototype.hasOwnProperty.call(user, 'is_seller');
      if (user?.id && !isAdminPayload) {
        req.user = user;
        break;
      }
    } catch (err) {
      // Invalid or expired tokens remain guests.
    }
  }
  next();
};

module.exports = optionalAuth;
