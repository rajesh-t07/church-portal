const jwt = require('jsonwebtoken');

const ensureAuthenticated = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const ensureAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'treasurer')) {
    return next();
  }
  res.status(403).json({ error: 'Forbidden' });
};

module.exports = { ensureAuthenticated, ensureAdmin };