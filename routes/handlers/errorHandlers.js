exports.catch404Handler = function (createError) {
  return function (req, res, next) {
    next(createError(404));
  };
};

exports.errorHandler = function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
};
