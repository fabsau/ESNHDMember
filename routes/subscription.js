const express = require("express");
const router = express.Router();
const subscriptionHandler = require("./handlers/subscriptionHandlers");

module.exports = function (stripe, isAuthenticated) {
  router.post(
    "/change-subscription",
    isAuthenticated,
    subscriptionHandler.changeSubscription(stripe),
  );
  router.post(
    "/cancel-subscription",
    isAuthenticated,
    subscriptionHandler.cancelSubscription(stripe),
  );
  router.post(
    "/undo-cancel-subscription",
    isAuthenticated,
    subscriptionHandler.undoCancelSubscription(stripe),
  );
  router.post(
    "/admin-cancel-subscription",
    isAuthenticated,
    subscriptionHandler.adminCancelSubscription(stripe),
  );
  return router;
};
