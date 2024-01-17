const express = require("express");
const router = express.Router();
const { defaultHandler, signupHandler } = require("./handlers/signupHandlers");

module.exports = () => {
  router.get("/", defaultHandler);
  router.post("/", signupHandler);
  return router;
};
