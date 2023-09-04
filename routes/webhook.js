const express = require("express");
const router = express.Router();
const { jwtClient } = require("../config/passport"); // replace './passport' with the actual path to your passport.js file
const mail = require("../config/mail")(jwtClient);

module.exports = function (stripe) {
  // Send a test email when the application starts
  mail.sendEmail(
    "Test email",
    "<p>This is a test email sent on application startup.</p>",
    "fabio@esn-heidelberg.de",
  );

  router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      let event;

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          req.headers["stripe-signature"],
          process.env.STRIPE_WEBHOOK_SECRET,
        );
      } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }

      const { type, data } = event;
      const object = data.object;

      switch (type) {
        case "checkout.session.completed":
          console.log("Checkout session completed");
          // Send an email to the user that their purchase was successful
          mail.sendEmail(
            "Your purchase was successful",
            "<p>Your purchase was successful. Thank you for your business.</p>",
            object.customer_email,
          );
          break;
        case "invoice.upcoming":
          console.log("Invoice upcoming");
          // Check the date and send an email 14 days before the next invoice
          break;
        case "customer.subscription.updated":
          console.log("Subscription updated");
          // Send a renewal confirmation email if the current_period_start date has changed
          // Send a switch confirmation email if the plan has changed
          break;
        case "customer.subscription.deleted":
          console.log("Subscription deleted");
          // Send an email to the user notifying them that their subscription was cancelled
          break;
        case "invoice.payment_failed":
          console.log("Payment failed");
          // Send an email to the user notifying them that their payment has failed
          break;
        case "charge.failed":
          console.log("Charge failed");
          // Notify the user that the charge attempt has failed
          break;
        case "customer.subscription.trial_will_end":
          console.log("Trial will end");
          // Notify the user that their trial is about to end
          break;
        case "customer.source.expiring":
          console.log("Source expiring");
          // Notify the user that their card is about to expire
          break;
        default:
          console.log("Unexpected event type");
          // Unexpected event type
          return res.status(400).end();
      }

      // Return a response to acknowledge receipt of the event
      res.json({ received: true });
    },
  );

  return router;
};
