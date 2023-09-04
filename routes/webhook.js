const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const webhookHandler = require("./handlers/webhookHandlers");

module.exports = function (stripe) {
  router.use(bodyParser.raw({ type: "application/json" }));
  router.post("/webhook", (req, res) => webhookHandler(req, res, stripe));
  return router;
};
