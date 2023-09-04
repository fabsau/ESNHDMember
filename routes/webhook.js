const express = require("express");
const router = express.Router();
const { jwtClient } = require("../config/passport");
const mail = require("../config/mail")(jwtClient);
const bodyParser = require("body-parser");

module.exports = function (stripe) {
  router.use(bodyParser.raw({ type: "application/json" }));

  // Send a test email when the application starts
  mail.sendEmail(
    "Test email",
    "<p>This is a test email sent on application startup.</p>",
    "fabio@esn-heidelberg.de",
  );

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
                "<p>Your recent charge attempt failed.</p>",
                customerEmail,
              );
              break;
            case "customer.source.expiring":
              mail.sendEmail(
                "Payment Source Expiring",
                "<p>Your payment source is expiring soon.</p>",
                customerEmail,
              );
              break;
            case "customer.subscription.deleted":
              mail.sendEmail(
                "Subscription Deleted",
                "<p>Your subscription has been deleted.</p>",
                customerEmail,
              );
              break;
            case "customer.subscription.updated":
              mail.sendEmail(
                "Subscription Updated",
                "<p>Your subscription has been updated.</p>",
                customerEmail,
              );
              break;
            case "invoice.payment_failed":
              mail.sendEmail(
                "Payment Failed",
                "<p>Your recent invoice payment failed.</p>",
                customerEmail,
              );
              break;
            case "invoice.upcoming":
              mail.sendEmail(
                "Upcoming Invoice",
                "<p>You have an upcoming invoice.</p>",
                customerEmail,
              );
              break;
            case "checkout.session.completed":
              mail.sendEmail(
                "Checkout Successful",
                "<p>Your checkout was successful.</p>",
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
