const { jwtClient } = require("../config/passport");
const mail = require("../config/mail")(jwtClient);

module.exports = function sendEmail(
  eventType,
  customerEmail,
  bccEmail,
  stripeEvent,
  firstName,
  lastName,
) {
  console.log("Event Type: ", eventType);
  console.log("Customer Email: ", customerEmail);
  console.log("BCC Email: ", bccEmail);
  console.log("Stripe Event: ", stripeEvent);
  switch (eventType) {
    case "charge.failed":
      mail.sendEmail(
        "Charge Failed",
        "chargeFailed",
        { firstName, lastName },
        customerEmail,
        bccEmail,
      );
      break;
    case "customer.source.expiring":
      mail.sendEmail(
        "Payment Source Expiring",
        "sourceExpiring",
        { firstName, lastName },
        customerEmail,
        bccEmail,
      );
      break;
    case "customer.subscription.deleted":
      const subscription = stripeEvent.data.object;
      mail.sendEmail(
        "Subscription Deleted",
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
          "Subscription Cancelled",
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
          "Subscription Cancellation Undone",
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

        mail.sendEmail(
          "Plan Changed",
          "planChanged",
          { prevPlan, newPlan, firstName, lastName },
          customerEmail,
          bccEmail,
        );
      }
      break;
    case "invoice.payment_failed":
      mail.sendEmail(
        "Payment Failed",
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
          "Subscription Renewing Soon",
          "subscriptionRenewing",
          { daysUntilDue, firstName, lastName },
          customerEmail,
          bccEmail,
        );
      }
      break;
    case "customer.subscription.trial_will_end":
      mail.sendEmail(
        "Trial Ending Soon",
        "trialEnding",
        { firstName, lastName },
        customerEmail,
        bccEmail,
      );
      break;
    case "checkout.session.completed":
      const checkoutSession = stripeEvent.data.object;
      mail.sendEmail(
        "Checkout Successful",
        "checkoutSuccessful",
        {
          checkoutSession,
          lastName,
          firstName,
        },
        customerEmail,
        bccEmail,
      );
      break;
    default:
      console.log(`Unhandled event type ${stripeEvent.type}`);
  }
  console.log(`Email sent for ${stripeEvent.type} to: `, customerEmail);
};
