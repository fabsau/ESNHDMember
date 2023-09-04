const express = require("express");
const router = express.Router();
const { defaultHandler } = require("./handlers/privacyHandlers");

module.exports = () => {
  router.get("/", defaultHandler);
  return router;
};
