const stripeHelper = require("../../helpers/stripeHelpers");

const allowedSubscriptions = [
  process.env.SUBSCRIPTION_PRICE_ID_MEMBER,
  process.env.SUBSCRIPTION_PRICE_ID_ALUMNI,
];

async function homeHandler(req, res) {
  const { givenName, familyName, email } = req.user;

  try {
    const customer = await stripeHelper.getCustomerByEmail(email);
    let customerUrl;
    let subscription;
    let currentPlan;

    if (customer) {
      const customerId = customer.id;
      const subscriptions =
        await stripeHelper.fetchCustomerSubscriptions(customerId);

      if (subscriptions && subscriptions.data.length > 0) {
        subscription = subscriptions.data[0];
        currentPlan = subscriptions.data[0].items.data[0].price.id;
      } else {
        currentPlan = null;
      }

      const session = await stripeHelper.createBillingPortalSession(
        customerId,
        `${req.protocol}://${req.get("host")}/home`,
      );

      customerUrl = session;
    }

    const plans = await stripeHelper.getPlans(
      currentPlan,
      allowedSubscriptions,
    );

    const renderOptions = {
      user: req.user,
      firstName: givenName,
      lastName: familyName,
      email: email,
      customerUrl: customerUrl,
      subscription: subscription,
      currentPlan: currentPlan,
      plans: plans,
      memberId: process.env.SUBSCRIPTION_PRICE_ID_MEMBER_6MONTHS,
      alumniId: process.env.SUBSCRIPTION_PRICE_ID_ALUMNI_6MONTHS,
      signedIn: true,
      page: "home",
    };
    renderOptions.message = req.session.message;
    req.session.message = null;
    res.render("home", renderOptions);
  } catch (error) {
    if (process.env.DEBUG_MODE === "TRUE") {
      console.log("Error retrieving customer:", error);
    }
    res.redirect("/");
  }
}

module.exports = homeHandler;
