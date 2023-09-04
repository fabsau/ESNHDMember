const express = require("express");
const router = express.Router();
const { logoutPostHandler } = require("./handlers/logoutHandlers");

module.exports = function () {
  router.post("/", logoutPostHandler);
  return router;
};
