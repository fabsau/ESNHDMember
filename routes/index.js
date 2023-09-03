const createError = require("http-errors");
const authRoutes = require("./auth");
const homeRoutes = require("./home");
const adminRoutes = require("./admin");
const purchaseRoutes = require("./purchase");
const privacyRoutes = require("./privacy");
const imprintRoutes = require("./imprint");
const subscriptionRoutes = require("./subscription");
const webhookRoutes = require("./webhook");
const logoutRoutes = require("./logout");
const healthcheckRoutes = require("./healthcheck");
const robotsRoutes = require("./robots");
const errorRoutes = require("./error");
const attachRoute = require("../middlewares/attachRoute");

module.exports = function (app, passport, stripe, isAuthenticated) {
  app.use(attachRoute);
  app.use("/", authRoutes(passport));
  app.use("/home", homeRoutes(stripe, isAuthenticated));
  app.use("/admin", adminRoutes(isAuthenticated));
  app.use("/", purchaseRoutes(stripe, isAuthenticated));
  app.use("/", subscriptionRoutes(stripe, isAuthenticated));
  app.use("/", webhookRoutes(stripe));
  app.use("/privacy", privacyRoutes());
  app.use("/imprint", imprintRoutes());
  app.use("/logout", logoutRoutes());
  app.use("/healthcheck", healthcheckRoutes());
  app.use("/", robotsRoutes());
  app.use("/", errorRoutes(createError));
};
