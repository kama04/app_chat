const { verifyJwt } = require('../utils/jwt');

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return req.cookies.token;
}

function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.redirect('/login');
  }

  try {
    req.user = verifyJwt(token);
    return next();
  } catch (error) {
    res.clearCookie('token');
    return res.redirect('/login');
  }
}

module.exports = {
  getTokenFromRequest,
  requireAuth
};
