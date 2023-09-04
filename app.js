const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const csurf = require("@dr.pogodin/csurf");
const helmet = require("helmet");
const dotenv = require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_API_KEY);
const rateLimit = require("express-rate-limit");
const createError = require("http-errors");
// const ExpressBrute = require('express-brute');
// const Ddos = require('ddos');

// Initializing express app
const app = express();

// Setting up views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Using middleware
app.use(logger("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Webhook route
app.use("/", webhookRoutes(stripe));

// Use express.json() after setting up routes
app.use(express.json());

// Importing custom modules
const ensureAuthenticated = require("./middlewares/ensureAuthenticated");
const rateLimiter = require("./middlewares/rateLimiter")(app);
const passportConfig = require("./config/passport")(
  passport,
  GoogleStrategy,
  app,
  session,
);
const helmetConfig = require("./config/helmet")(app, helmet);

// Apply CSRF Protection middleware here
const csrfProtection = require("./middlewares/csrfProtection")(app, csurf);
app.use(csrfProtection);

const routes = require("./routes/index")(
  app,
  passport,
  stripe,
  ensureAuthenticated,
);

// Error handling
app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
