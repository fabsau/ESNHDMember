const express = require("express");
const router = express.Router();
const { defaultHandler } = require("./handlers/imprintHandlers");

module.exports = () => {
  router.get("/", defaultHandler);
  return router;
};
