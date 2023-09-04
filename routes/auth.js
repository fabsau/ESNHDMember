const express = require("express");
const router = express.Router();
const { defaultHandler, loginHandler, callbackHandler } = require('./handlers/authHandlers');

module.exports = (passport) => {
  router.get("/", defaultHandler);
  router.get("/login", loginHandler(passport));
  router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), callbackHandler);
  return router;
};
