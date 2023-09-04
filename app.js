// Importing required modules
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
const bodyParser = require("body-parser");

// Importing Webhook routes
const webhookRoutes = require("./routes/webhook");

// Importing custom modules
const ensureAuthenticated = require("./middlewares/ensureAuthenticated");
const rateLimiter = require("./middlewares/rateLimiter");
const passportConfig = require("./config/passport");
const helmetConfig = require("./config/helmet");

// Import routes
const routes = require("./routes/index");

// Initializing express app
const app = express();

// Setting up views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Applying configurations
rateLimiter(app);
helmetConfig(app, helmet);
passportConfig(passport, GoogleStrategy, app, session);

// Webhook parser
app.use("/webhook", bodyParser.raw({ type: "*/*" }), webhookRoutes(stripe));

// Using middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Applying routes
routes(app, passport, stripe, ensureAuthenticated);

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
