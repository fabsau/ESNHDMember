const express = require("express");
const router = express.Router();
const { jwtClient } = require("../config/passport");
const mail = require("../config/mail")(jwtClient);
const bodyParser = require("body-parser");
const { fetchUserSecondaryEmailByEmail } = require("./admin");

module.exports = function (stripe) {
  router.use(bodyParser.raw({ type: "application/json" }));

  router.post("/webhook", async (request, response) => {
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
        .then(async (customer) => {
          const customerEmail = customer.email;
          const bccEmail = await fetchUserSecondaryEmailByEmail(customerEmail);
          switch (event.type) {
            case "charge.failed":
              mail.sendEmail(
                "Charge Failed",
                "chargeFailed",
                {},
                customerEmail,
                bccEmail,
              );
              break;
            case "customer.source.expiring":
              mail.sendEmail(
                "Payment Source Expiring",
                "sourceExpiring",
                {},
                customerEmail,
                bccEmail,
              );
              break;
            case "customer.subscription.deleted":
              const subscription = event.data.object;
              mail.sendEmail(
                "Subscription Deleted",
                "subscriptionDeleted",
                {
                  subscription,
                  plan: subscription.plan,
                },
                customerEmail,
                bccEmail,
              );
              break;
            case "customer.subscription.updated":
              const prevAttributes = event.data.previous_attributes;
              const newAttributes = event.data.object;

              // Upon Subscription cancellation
              if (
                newAttributes.cancel_at_period_end &&
                prevAttributes.cancel_at_period_end === false
              ) {
                mail.sendEmail(
                  "Subscription Cancelled",
                  "subscriptionCancelled",
                  {
                    subscription: newAttributes,
                    plan: newAttributes.plan,
                  },
                  customerEmail,
                  bccEmail,
                );
              }
              // The cancellation has been undone
              else if (
                !newAttributes.cancel_at_period_end &&
                prevAttributes.cancel_at_period_end === true
              ) {
                mail.sendEmail(
                  "Subscription Cancellation Undone",
                  "subscriptionCancellationUndone",
                  {
                    subscription: newAttributes,
                    plan: newAttributes.plan,
                  },
                  customerEmail,
                  bccEmail,
                );
              }
              // Upon Plan changing
              else if (prevAttributes.items) {
                const prevPlan = prevAttributes.items.data[0].plan;
                const newPlan = newAttributes.items.data[0].plan;

                mail.sendEmail(
                  "Plan Changed",
                  "planChanged",
                  { prevPlan, newPlan },
                  customerEmail,
                  bccEmail,
                );
              }
              break;
            case "invoice.payment_failed":
              mail.sendEmail(
                "Payment Failed",
                "paymentFailed",
                {},
                customerEmail,
                bccEmail,
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
                  bccEmail,
                );
              }
              break;
            case "customer.subscription.trial_will_end":
              mail.sendEmail(
                "Trial Ending Soon",
                "trialEnding",
                {},
                customerEmail,
                bccEmail,
              );
              break;
            case "checkout.session.completed":
              const checkoutSession = event.data.object;
              mail.sendEmail(
                "Checkout Successful",
                "checkoutSuccessful",
                {
                  checkoutSession,
                },
                customerEmail,
                bccEmail,
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
