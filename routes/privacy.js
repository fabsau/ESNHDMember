const express = require("express");
const router = express.Router();

module.exports = function () {
  router.get("/", function (req, res) {
    res.render("privacy", { signedIn: !!req.user });
  });

  return router;
};
