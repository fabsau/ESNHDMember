const {
  fetchUserSecondaryEmailByEmail,
  fetchUserNamesByEmail,
} = require("../../helpers/googleAdminHelper");
const sendEmail = require("../../helpers/emailSender");

module.exports = async function (request, response, stripe) {
  const sig = request.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    if (process.env.DEBUG_MODE === "TRUE") {
      console.log("Error in webhook signature validation: ", err.message);
    }
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (process.env.DEBUG_MODE === "TRUE") {
    console.log("Webhook received: ", event);
  }
  if (event.data.object.customer || event.type === 'customer.updated') {
    const customerId = event.type === 'customer.updated' ? event.data.object.id : event.data.object.customer;

    stripe.customers
      .retrieve(customerId)
      .then(async (customer) => {
        const customerEmail = customer.email;
        if (process.env.DEBUG_MODE === "TRUE") {
          console.log("Customer Email: ", customerEmail);
        }
        const bccEmail = await fetchUserSecondaryEmailByEmail(customerEmail);
        const { firstName, lastName } =
          await fetchUserNamesByEmail(customerEmail);
        if (process.env.DEBUG_MODE === "TRUE") {
          console.log("BCC Email: ", bccEmail);
          console.log("Event: ", event);
        }
        sendEmail(
          event.type,
          customerEmail,
          bccEmail,
          event,
          firstName,
          lastName,
        );
      })
      .catch((err) => {
        if (process.env.DEBUG_MODE === "TRUE") {
          console.log("Error retrieving customer: ", err);
        }
      });
  } else {
    if (process.env.DEBUG_MODE === "TRUE") {
      console.log(`${event.type} event without customer id`);
    }
  }

  response.json({ received: true });
};
