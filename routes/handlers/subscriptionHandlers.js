const stripeHelper = require("../../helpers/stripeHelpers");

exports.changeSubscription = (stripe) => async (req, res) => {
  const { email } = req.user;
  const { newPlanId } = req.body;

  try {
    const customerId = await stripeHelper.findCustomer(stripe, email);
    if (customerId) {
      await stripeHelper.updateSubscription(stripe, customerId, newPlanId);
    }
    req.session.message = {
      type: "success",
      text: "Plan was successfully changed! You will receive an email confirmation shortly.",
    };
    res.redirect("/home");
  } catch (error) {
    console.error("Error switching membership type:", error);
    req.session.message = {
      type: "error",
      text: "Error switching membership type, please refresh the page!",
    };
    res.redirect("/home");
  }
};

exports.cancelSubscription = (stripe) => async (req, res) => {
  const { email } = req.user;
  try {
    const customerId = await stripeHelper.findCustomer(stripe, email);
    if (customerId) {
      await stripeHelper.cancelSubscriptionAtPeriodEnd(stripe, customerId);
    }
    req.session.message = {
      type: "success",
      text: "Cancellation was successful! You will receive an email confirmation shortly.",
    };
    res.redirect("/home");
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    req.session.message = {
      type: "error",
      text: "Error cancelling subscription, please refresh the page!",
    };
    res.redirect("/home");
  }
};

exports.undoCancelSubscription = (stripe) => async (req, res) => {
  const { email } = req.user;
  try {
    const customerId = await stripeHelper.findCustomer(stripe, email);
    if (customerId) {
      await stripeHelper.undoCancelSubscription(stripe, customerId);
    }
    req.session.message = {
      type: "success",
      text: "Cancellation was successfully undone! You will receive an email confirmation shortly.",
    };
    res.redirect("/home");
  } catch (error) {
    console.error("Error undoing subscription cancellation:", error);
    req.session.message = {
      type: "error",
      text: "Error undoing subscription cancellation, please refresh the page!",
    };
    res.redirect("/home");
  }
};

exports.adminCancelSubscription = (stripe) => async (req, res) => {
  const { email } = req.body;
  try {
    const customerId = await stripeHelper.findCustomer(stripe, email);
    if (customerId) {
      await stripeHelper.adminCancelSubscription(stripe, customerId);
    }
    res.json({
      message:
        "Cancellation was successful! The user will receive an email confirmation shortly",
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({
      message: "Error cancelling subscription. Please try again.",
    });
  }
};
