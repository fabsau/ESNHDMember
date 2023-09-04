const express = require("express");
const router = express.Router();
const purchaseHandler = require("./handlers/purchaseHandlers");

module.exports = function (stripe, isAuthenticated) {
  router.post("/purchase", isAuthenticated, purchaseHandler.purchase(stripe));
  router.get(
    "/checkout_success",
    isAuthenticated,
    purchaseHandler.checkoutSuccess,
  );
  router.get("/checkout_error", isAuthenticated, purchaseHandler.checkoutError);
  return router;
};
