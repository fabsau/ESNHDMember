// routes/handlers/adminHandlers.js
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
    const customerSubscriptionsMap = await fetchAllSubscriptions(planDisplayNames);
    const customerEmailIdMap = await fetchAllCustomers();

    let allUsers = [];
    let stats = {
      totalUsers: 0,
      activeSubscriptions: 0,
      member: 0,
      alumni: 0,
      memberTrial: 0,
      cancelled: 0,
      noPlan: 0,
    };

    let pageToken;
    do {
      const users = await fetchUsers(pageToken);
      if (!users) continue;

      for (let user of users.data.users) {
        // Try to find a secondary email if it exists
        user.secondaryEmail = user.emails.find(
          (email) =>
            email.type === "home" ||
            email.type === "work" ||
            email.type === "custom" ||
            email.type === "other"
        )?.address;

        const customerId = customerEmailIdMap.get(user.primaryEmail);
        if (customerId) {
          // Fetch subscription and past invoices for this Stripe customer
          const [activeSubscription, invoices] = await Promise.all([
            fetchActiveCustomerSubscription(customerId),
            fetchInvoices(customerId),
          ]);

          user.paymentHistory = invoices.data;

          if (activeSubscription) {
            // If Stripe says the subscription is active
            user.subscription = activeSubscription;
            user.planId = activeSubscription.items.data[0].price.id;
            user.planDisplayName = planDisplayNames[user.planId] || "Active";

            // If the plan matches "Member" or "Alumni," increment those counters
            if (user.planDisplayName === "Member") stats.member++;
            if (user.planDisplayName === "Alumni") stats.alumni++;

            // Either way, we consider it an "active subscription"
            stats.activeSubscriptions++;
          } else if (user.paymentHistory && user.paymentHistory.length > 0) {
            // No active subscription but has some invoice history
            const sortedInvoices = [...user.paymentHistory].sort(
              (a, b) => b.created - a.created
            );
            const lastInvoice = sortedInvoices[0];

            // A 0€ invoice with no current subscription => "Member Trial"
            if (lastInvoice.total === 0) {
              user.planDisplayName = "Member Trial";
              stats.memberTrial++;
              stats.activeSubscriptions++; // Also counted as active
            } else {
              // Otherwise, the user must be "Cancelled"
              user.planDisplayName = "Cancelled";
              stats.cancelled++;
            }
          } else {
            // Has a Stripe customer record but no invoice history => Never Paid
            user.planDisplayName = "Never Paid";
          }
        } else {
          // If no Stripe record at all
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