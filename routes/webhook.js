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

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Get customer ID from session
      const customerId = session.customer;

      // Retrieve customer from Stripe
      stripe.customers
        .retrieve(customerId)
        .then((customer) => {
          const customerEmail = customer.email;
          console.log("Customer email: ", customerEmail);

          // Send a confirmation email to the customer
          mail.sendEmail(
            "Checkout Successful",
            "<p>Your checkout was successful.</p>",
            customerEmail,
          );

          console.log("Confirmation email sent to: ", customerEmail);
        })
        .catch((err) => {
          console.log("Error retrieving customer: ", err);
        });
    }

    // Return a response to Stripe
    response.json({ received: true });
  });

  return router;
};
