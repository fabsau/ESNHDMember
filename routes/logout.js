const express = require("express");
const router = express.Router();

module.exports = function () {
  router.post("/", function (req, res) {
    req.logout(function (err) {
      if (err) {
        console.log(err);
      }
      req.session.destroy(function (err) {
        if (err) {
          console.log(err);
        }
        res.redirect("/");
      });
    });
  });

  return router;
};
