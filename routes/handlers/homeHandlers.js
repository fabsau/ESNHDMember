const stripeHelper = require("../../helpers/stripeHelpers");

module.exports = function (stripe) {
  return async function (req, res) {
    try {
      // Get user data
      const userData = stripeHelper.getUserData(req.user);

      // Get Stripe data
      const stripeData = await stripeHelper.getStripeData(
        stripe,
        userData.email,
        req,
      );

      // Set renderOptions
      const renderOptions = {
        ...userData,
        ...stripeData,
        signedIn: true,
        page: "home",
        memberId: process.env.SUBSCRIPTION_PRICE_ID_MEMBER_6MONTHS,
        alumniId: process.env.SUBSCRIPTION_PRICE_ID_ALUMNI_6MONTHS,
      };
      renderOptions.message = req.session.message;
      req.session.message = null;

      res.render("home", renderOptions);
    } catch (error) {
      console.log("Error retrieving customer:", error);
      res.redirect("/");
    }
  };
};
