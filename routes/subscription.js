const express = require("express");
const router = express.Router();

module.exports = function (stripe, isAuthenticated) {
  router.post("/change-subscription", isAuthenticated, async (req, res) => {
    const { email } = req.user;
    const newPlanId = req.body.newPlanId;

    try {
      const customers = await stripe.customers.list({ email: email, limit: 1 });

      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
        });

        if (subscriptions.data.length > 0) {
          const currentSubscription = subscriptions.data[0];
          const currentPlanId = currentSubscription.items.data[0].price.id;

          if (req.body.newPlanId === req.user.currentPlanId) {
            req.session.message = {
              type: "info",
              text: "You selected the same subscription as your current one.",
            };
            res.redirect("/home");
            return;
          }
          await stripe.subscriptions.update(currentSubscription.id, {
            cancel_at_period_end: false,
            proration_behavior: "create_prorations",
            items: [
              {
                id: currentSubscription.items.data[0].id,
                price: newPlanId,
              },
            ],
          });
        }
      }
      req.session.message = {
        type: "success",
        text: "Plan was successful changed! You will receive an email confirmation shortly.",
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
  });

  router.post("/cancel-subscription", isAuthenticated, async (req, res) => {
    const { email } = req.user;
    try {
      // Fetch customer details from Stripe
      const customer = await stripe.customers.list({
        email: email,
        limit: 1,
      });
      if (customer.data.length > 0) {
        const customerId = customer.data[0].id;
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
        });
        // Cancel the existing subscription at the end of the current period
        if (subscriptions.data.length > 0) {
          await stripe.subscriptions.update(subscriptions.data[0].id, {
            cancel_at_period_end: true,
          });
        }
      }
      // Redirect to the home page with a successful cancellation message
      req.session.message = {
        type: "success",
        text: "Cancellation was successful! You will receive an email confirmation shortly.",
      };
      res.redirect("/home");
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      // On error, redirect to the home page
      req.session.message = {
        type: "error",
        text: "Error cancelling subscription, please refresh the page!",
      };
      res.redirect("/home");
    }
  });

  router.post("/undo-cancel-subscription", isAuthenticated, async (req, res) => {
    const { email } = req.user;
    try {
      // Fetch customer details from Stripe
      const customer = await stripe.customers.list({
        email: email,
        limit: 1,
      });
      if (customer.data.length > 0) {
        const customerId = customer.data[0].id;
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
        });
        // Undo subscription cancellation
        if (subscriptions.data.length > 0) {
          await stripe.subscriptions.update(subscriptions.data[0].id, {
            cancel_at_period_end: false,
          });
        }
      }
      // Redirect to the home page with a successful undo cancellation message
      req.session.message = {
        type: "success",
        text: "Cancellation was successfully undone! You will receive an email confirmation shortly.",
      };
      res.redirect("/home");
    } catch (error) {
      console.error("Error undoing subscription cancellation:", error);
      // On error, redirect to the home page
      req.session.message = {
        type: "error",
        text: "Error undoing subscription cancellation, please refresh the page!",
      };
      res.redirect("/home");
    }
  });

  router.post(
      "/admin-cancel-subscription",
      isAuthenticated,
      async (req, res) => {
        const { email } = req.body;

        try {
          const customers = await stripe.customers.list({
            email: email,
            limit: 1,
          });

          if (customers.data.length > 0) {
            const customerId = customers.data[0].id;
            const subscriptions = await stripe.subscriptions.list({
              customer: customerId,
            });

            for (const subscription of subscriptions.data) {
              await stripe.subscriptions.cancel(subscription.id);
            }
          }

          res.json({ message: "Cancellation was successful! The user will receive an email confirmation shortly" });
        } catch (error) {
          console.error("Error cancelling subscription:", error);
          res.status(500).json({
            message: "Error cancelling subscription. Please try again.",
          });
        }
      }
  );

  return router;
};
