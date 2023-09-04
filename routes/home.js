const express = require("express");
const router = express.Router();
const homeHandler = require("./handlers/homeHandlers");

module.exports = function (stripe, isAuthenticated) {
  router.get("/", isAuthenticated, function (req, res) {
    homeHandler(req, res, stripe);
  });

  return router;
};
