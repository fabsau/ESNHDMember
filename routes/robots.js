const express = require("express");
const router = express.Router();
const robotHandler = require("./handlers/robotsHandlers");

module.exports = function () {
  router.get("/robots.txt", robotHandler);
  return router;
};
