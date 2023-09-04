const express = require("express");
const router = express.Router();
const { jwtClient } = require("../config/passport");
const mail = require("../config/mail")(jwtClient);
const bodyParser = require("body-parser");

module.exports = function (stripe) {
  router.use(bodyParser.raw({ type: "application/json" }));

  // Send a test email when the application starts
  mail.sendEmail("Test email", "testEmail", {}, "fabio@esn-heidelberg.de");

  router.post("/webhook", (request, response) => {
    const sig = request.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.log("Error in webhook signature validation: ", err.message);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    console.log("Webhook received: ", event);

    // Check if event.data.object.customer exists
    if (event.data.object.customer) {
      const customerId = event.data.object.customer;

      // Retrieve customer from Stripe
      stripe.customers
        .retrieve(customerId)
        .then((customer) => {
          const customerEmail = customer.email;
          switch (event.type) {
            case "charge.failed":
              mail.sendEmail(
                "Charge Failed",
                "chargeFailed",
                {},
                customerEmail,
              );
              break;
            case "customer.source.expiring":
              mail.sendEmail(
                "Payment Source Expiring",
                "sourceExpiring",
                {},
                customerEmail,
              );
              break;
            case "customer.subscription.deleted":
              mail.sendEmail(
                "Subscription Deleted",
                "subscriptionDeleted",
                {},
                customerEmail,
              );
              break;
            case "customer.subscription.updated":
              const prevAttributes = event.data.previous_attributes;
              const newAttributes = event.data.object;
              if (newAttributes.cancel_at_period_end) {
                mail.sendEmail(
                  "Subscription Cancelled",
                  "subscriptionCancelled",
                  {},
                  customerEmail,
                );
              }
              // Check if plan was changed
              else if (prevAttributes.items) {
                const prevPlan = prevAttributes.items.data[0].plan;
                const newPlan = newAttributes.items.data[0].plan;

                mail.sendEmail(
                  "Plan Changed",
                  "planChanged",
                  { prevPlan, newPlan },
                  customerEmail,
                );
              } else if (
                prevAttributes.default_payment_method &&
                newAttributes.default_payment_method !==
                  prevAttributes.default_payment_method
              ) {
                mail.sendEmail(
                  "Payment Method Updated",
                  "paymentMethodUpdated",
                  {},
                  customerEmail,
                );
              } else {
                mail.sendEmail(
                  "Subscription Updated",
                  "subscriptionUpdated",
                  {},
                  customerEmail,
                );
              }
              break;
            case "invoice.payment_failed":
              mail.sendEmail(
                "Payment Failed",
                "paymentFailed",
                {},
                customerEmail,
              );
              break;
            case "invoice.upcoming":
              const daysUntilDue = Math.floor(
                (new Date(event.data.object.due_date * 1000) - Date.now()) /
                  (1000 * 60 * 60 * 24),
              );
              if (daysUntilDue <= 14) {
                mail.sendEmail(
                  "Subscription Renewing Soon",
                  "subscriptionRenewing",
                  { daysUntilDue },
                  customerEmail,
                );
              }
              break;
            case "customer.subscription.trial_will_end":
              mail.sendEmail(
                "Trial Ending Soon",
                "trialEnding",
                {},
                customerEmail,
              );
              break;
            case "checkout.session.completed":
              mail.sendEmail(
                "Checkout Successful",
                "checkoutSuccessful",
                {},
                customerEmail,
              );
              break;
            default:
              console.log(`Unhandled event type ${event.type}`);
          }
          console.log(`Email sent for ${event.type} to: `, customerEmail);
        })
        .catch((err) => {
          console.log("Error retrieving customer: ", err);
        });
    } else {
      console.log(`${event.type} event without customer id`);
    }

    // Return a response to Stripe
    response.json({ received: true });
  });

  return router;
};
