const {
  fetchUserSecondaryEmailByEmail,
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
    console.log("Error in webhook signature validation: ", err.message);
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // console.log("Webhook received: ", event);

  if (event.data.object.customer) {
    const customerId = event.data.object.customer;

    stripe.customers
      .retrieve(customerId)
      .then(async (customer) => {
        const customerEmail = customer.email;
        console.log("Customer Email: ", customerEmail);
        const bccEmail = await fetchUserSecondaryEmailByEmail(customerEmail);
        console.log("BCC Email: ", bccEmail);
        console.log("Event: ", event);
        sendEmail(event.type, customerEmail, bccEmail, event);
      })
      .catch((err) => {
        console.log("Error retrieving customer: ", err);
      });
  } else {
    console.log(`${event.type} event without customer id`);
  }

  response.json({ received: true });
};
