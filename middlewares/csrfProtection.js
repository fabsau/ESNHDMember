module.exports = function (csurf) {
  // Create the CSRF middleware
  const csrfMiddleware = csurf();

  // Return a middleware function
  return function (req, res, next) {
    csrfMiddleware(req, res, function (err) {
      if (err) return next(err);

      res.locals.csrfToken = req.csrfToken();
      next();
    });
  };
};
