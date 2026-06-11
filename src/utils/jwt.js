const jwt = require('jsonwebtoken');

function getJwtSecret() {
  return process.env.JWT_SECRET || 'dev-only-change-this-secret';
}

function createJwt(user) {
  // Keep only safe, useful user data inside the token payload.
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function verifyJwt(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  createJwt,
  verifyJwt
};
