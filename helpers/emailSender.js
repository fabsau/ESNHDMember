const { jwtClient } = require("../config/passport");
const mail = require("../config/mail")(jwtClient);
const stripeHelpers = require("./stripeHelpers.js");

module.exports = function sendEmail(
  eventType,
  customerEmail,
  bccEmail,
  stripeEvent,
  firstName,
  lastName,
) {
  if (process.env.DEBUG_MODE === "TRUE") {
    console.log("Event Type: ", eventType);
    console.log("Customer Email: ", customerEmail);
    console.log("BCC Email: ", bccEmail);
    console.log("Stripe Event: ", stripeEvent);
  }
  switch (eventType) {
    case "charge.failed":
      mail.sendEmail(
        "ESN Heidelberg Charge Failed",
        "chargeFailed",
        { firstName, lastName },
        customerEmail,
        bccEmail,
      );
      break;
    case "customer.source.expiring":
      mail.sendEmail(
        "ESN Heidelberg Payment Method Expiring",
        "sourceExpiring",
        { firstName, lastName },
        customerEmail,
        bccEmail,
      );
      break;
    case "customer.subscription.deleted":
      const subscription = stripeEvent.data.object;
      mail.sendEmail(
        "ESN Heidelberg Membership Deleted",
        "subscriptionDeleted",
        {
          subscription,
          plan: subscription.plan,
          firstName,
          lastName,
        },
        customerEmail,
        bccEmail,
      );
      break;
    case "customer.subscription.updated":
      const prevAttributes = stripeEvent.data.previous_attributes;
      const newAttributes = stripeEvent.data.object;

      // Upon Subscription cancellation
      if (
        newAttributes.cancel_at_period_end &&
        prevAttributes.cancel_at_period_end === false
      ) {
        mail.sendEmail(
          "ESN Heidelberg Membership Cancelled",
          "subscriptionCancelled",
          {
            subscription: newAttributes,
            plan: newAttributes.plan,
            firstName,
            lastName,
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
          "ESN Heidelberg Membership Reactivated",
          "subscriptionCancellationUndone",
          {
            subscription: newAttributes,
            plan: newAttributes.plan,
            firstName,
            lastName,
          },
          customerEmail,
          bccEmail,
        );
      }
      // Upon Plan changing
      else if (prevAttributes.items) {
        const prevPlan = prevAttributes.items.data[0].plan;
        const newPlan = newAttributes.items.data[0].plan;
        const periodEnd = newAttributes.current_period_end;

        if (process.env.DEBUG_MODE === 'TRUE') {
          console.log("Previous Plan: ", prevPlan);
          console.log("New Plan: ", newPlan);
          console.log("Period End: ", periodEnd);
        }

        mail.sendEmail(
        "ESN Heidelberg Membership Plan Updated",
        "planChanged",
        { prevPlan, newPlan, periodEnd, firstName, lastName },
        customerEmail,
        bccEmail,
        );
      }
      break;
    case "invoice.payment_failed":
      mail.sendEmail(
        "ESN Heidelberg Payment Failed",
        "paymentFailed",
        { firstName, lastName },
        customerEmail,
        bccEmail,
      );
      break;
    case "invoice.upcoming":
      const daysUntilDue = Math.floor(
        (new Date(stripeEvent.data.object.due_date * 1000) - Date.now()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysUntilDue <= 14) {
        mail.sendEmail(
          "ESN Heidelberg Membership Renewing Soon",
          "subscriptionRenewing",
          { daysUntilDue, firstName, lastName },
          customerEmail,
          bccEmail,
        );
      }
      break;
    case "customer.subscription.trial_will_end":
      mail.sendEmail(
        "ESN Heidelberg Trial Ending Soon",
        "trialEnding",
        { firstName, lastName },
        customerEmail,
        bccEmail,
      );
      break;
    case "checkout.session.completed":
      const checkoutSession = stripeEvent.data.object;
      const customerId = checkoutSession.customer; // assuming checkoutSession contains customer id
      stripeHelpers.fetchCustomerSubscriptions(customerId)
      .then(subscriptions => {
        const relevantSubscription = subscriptions.data[0]; // pick the relevant subscription
        console.log("Relevant Subscription:", relevantSubscription); // Add this line
        mail.sendEmail(
        "ESN Heidelberg Purchase Successful",
        "checkoutSuccessful",
        {
          checkoutSession,
          subscription: relevantSubscription,
          plan: relevantSubscription.plan,
          lastName,
          firstName,
        },
        customerEmail,
        bccEmail,
        );
      })
      .catch(err => console.error(err));
      break;
    default:
      if (process.env.DEBUG_MODE === "TRUE") {
        console.log(`Unhandled event type ${stripeEvent.type}`);
      }
  }
  if (process.env.DEBUG_MODE === "TRUE") {
    console.log(`Email sent for ${stripeEvent.type} to: `, customerEmail);
  }
};
