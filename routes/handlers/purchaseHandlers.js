const stripeHelper = require("../../helpers/stripeHelpers");

exports.purchase = (stripe) => async (req, res) => {
  const { priceId, trialEnabled, paymentMethod } = req.body;
  const { email } = req.user;

  const customerId = await stripeHelper.findOrCreateCustomer(stripe, email);

  const trial_period_days =
    trialEnabled === "on"
      ? parseInt(process.env.TRIAL_LENGTHS_DAYS) || 0
      : null;

  const sessionData = stripeHelper.prepareSessionData(
    priceId,
    customerId,
    trial_period_days,
    paymentMethod,
    req.protocol,
    req.get("host"),
  );

  const session = await stripe.checkout.sessions.create(sessionData);
  res.redirect(303, session.url);
};

exports.checkoutSuccess = (req, res) => {
  req.session.message = { type: "success", text: "Purchase was successful!" };
  res.redirect("/home");
};

exports.checkoutError = (req, res) => {
  req.session.message = {
    type: "danger",
    text: "Something went wrong, please retry!",
  };
  res.redirect("/home");
};
