const express = require("express");
const router = express.Router();
const { adminHandler } = require("./handlers/adminHandlers");

module.exports = (isAuthenticated) => {
  router.get("/", isAuthenticated, adminHandler);
  return router;
};
