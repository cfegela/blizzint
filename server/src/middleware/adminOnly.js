const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    return next(error);
  }
  next();
};

module.exports = adminOnly;
