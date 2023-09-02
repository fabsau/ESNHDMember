const rateLimit = require("express-rate-limit");

module.exports = function (app) {
  if (process.env.ENABLE_RATE_LIMITING === "TRUE") {
    const limiter = rateLimit({
      windowMs: 60 * 1000 * Number(process.env.RATE_LIMIT_WINDOW) || 900000,
      max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    });

    app.use((req, res, next) => {
      if (req.path === "/healthcheck") {
        return next();
      } else {
        return limiter(req, res, next);
      }
    });
  }
};
