const express = require("express");
const router = express.Router();
const { catch404Handler, errorHandler } = require("./handlers/errorHandlers");

module.exports = (createError) => {
  router.use(catch404Handler(createError));
  router.use(errorHandler);
  return router;
};
