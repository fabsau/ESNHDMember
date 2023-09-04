const {
  fetchAllSubscriptions,
  fetchAllCustomers,
  fetchActiveCustomerSubscription,
  fetchInvoices,
} = require("../../helpers/stripeHelpers");
const {
  fetchUsers,
  fetchUserSecondaryEmailByEmail,
} = require("../../helpers/googleAdminHelper");

const planDisplayNames = {
  [process.env.SUBSCRIPTION_PRICE_ID_MEMBER_6MONTHS]: "Member",
  [process.env.SUBSCRIPTION_PRICE_ID_ALUMNI_6MONTHS]: "Alumni",
};

exports.adminHandler = async (req, res) => {
  const baseOU = process.env.GOOGLE_ADMIN_BASE_OU;
  if (req.user.ou.startsWith(baseOU)) {
    const customerSubscriptionsMap =
      await fetchAllSubscriptions(planDisplayNames);
    const customerEmailIdMap = await fetchAllCustomers();

    let allUsers = [];
    let stats = {
      totalUsers: 0,
      activeSubscriptions: 0,
      member: 0,
      alumni: 0,
      cancelled: 0,
      noPlan: 0,
    };
    let pageToken;
    do {
      const users = await fetchUsers(pageToken);
      if (!users) continue;

      for (let user of users.data.users) {
        user.secondaryEmail = user.emails.find(
          (email) =>
            email.type === "home" ||
            email.type === "work" ||
            email.type === "custom" ||
            email.type === "other",
        )?.address;
        const customerId = customerEmailIdMap.get(user.primaryEmail);
        if (customerId) {
          const [activeSubscription, invoices] = await Promise.all([
            fetchActiveCustomerSubscription(customerId),
            fetchInvoices(customerId),
          ]);

          user.paymentHistory = invoices.data;

          if (activeSubscription) {
            stats.activeSubscriptions++;
            user.subscription = activeSubscription;
            user.planId = activeSubscription.items.data[0].price.id;
            user.planDisplayName = planDisplayNames[user.planId];
            if (user.planDisplayName === "Member") stats.member++;
            if (user.planDisplayName === "Alumni") stats.alumni++;
          } else if (user.paymentHistory && user.paymentHistory.length > 0) {
            user.planDisplayName = "Cancelled";
            stats.cancelled++;
          } else {
            user.planDisplayName = "Never Paid";
          }
        } else {
          stats.noPlan++;
        }
      }

      allUsers.push(...users.data.users);
      stats.totalUsers += users.data.users.length;
      pageToken = users.data.nextPageToken;
    } while (pageToken);

    res.render("admin", {
      users: allUsers,
      stats,
      signedIn: !!req.user,
      page: "admin",
    });
  } else {
    res.status(403).send("Unauthorized");
  }
};
