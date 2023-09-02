const express = require("express");
const router = express.Router();

module.exports = function () {
  router.get("/robots.txt", function (req, res) {
    res.type("text/plain");
    res.send("User-agent: *\nDisallow: /");
  });

  return router;
};
