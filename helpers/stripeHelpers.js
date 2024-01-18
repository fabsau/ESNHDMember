const stripe = require("stripe")(process.env.STRIPE_API_KEY);

exports.fetchSubscriptions = async function (planId, startAfterId) {
  try {
    return await stripe.subscriptions.list({
      price: planId,
      status: "active",
      starting_after: startAfterId,
    });
  } catch (error) {
    if (process.env.DEBUG_MODE === "TRUE") {
      console.error(
      `Error fetching subscriptions for planId ${planId}: ${error}`,
      );
    }
    return null;
  }
};

exports.fetchCustomers = async function (startAfterId) {
  try {
    return await stripe.customers.list({
      starting_after: startAfterId,
    });
  } catch (error) {
    if (process.env.DEBUG_MODE === "TRUE") {
      console.error(`Error fetching customers: ${error}`);
    }
    return null;
  }
};

exports.fetchCustomerSubscriptions = async function (customerId) {
  try {
    return await stripe.subscriptions.list({ customer: customerId });
  } catch (error) {
    if (process.env.DEBUG_MODE === "TRUE") {
      console.error(
      `Error fetching customer subscriptions for customerId ${customerId}: ${error}`,
      );
    }
    return null;
  }
};

exports.fetchInvoices = async function (customerId) {
  try {
    return await stripe.invoices.list({ customer: customerId });
  } catch (error) {
    if (process.env.DEBUG_MODE === "TRUE") {
      console.error(
      `Error fetching invoices for customerId ${customerId}: ${error}`,
      );
    }
    return null;
  }
};

exports.fetchAllSubscriptions = async function (planDisplayNames) {
  const customerSubscriptionsMap = new Map();
  for (const planId in planDisplayNames) {
    let hasMore;
    let startAfterId;
    do {
      const subscriptions = await exports.fetchSubscriptions(
        planId,
        startAfterId,
      );
      if (!subscriptions) continue;

      subscriptions.data.forEach((subscription) =>
        customerSubscriptionsMap.set(subscription.customer, subscription),
      );
      hasMore = subscriptions.has_more;
      if (subscriptions.data.length > 0)
        startAfterId = subscriptions.data[subscriptions.data.length - 1].id;
    } while (hasMore);
  }
  return customerSubscriptionsMap;
};

exports.fetchAllCustomers = async function () {
  const customerEmailIdMap = new Map();
  let hasMore;
  let startAfterId;
  do {
    const customers = await exports.fetchCustomers(startAfterId);
    if (!customers) continue;

    customers.data.forEach(
      (customer) =>
        customer.email && customerEmailIdMap.set(customer.email, customer.id),
    );
    hasMore = customers.has_more;
    if (customers.data.length > 0)
      startAfterId = customers.data[customers.data.length - 1].id;
  } while (hasMore);
  return customerEmailIdMap;
};

exports.fetchActiveCustomerSubscription = async function (customerId) {
  try {
    const customerSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    });
    return customerSubscriptions.data[0];
  } catch (error) {
    if (process.env.DEBUG_MODE === "TRUE") {
      console.error(
      `Error fetching active subscription for customerId ${customerId}: ${error}`,
      );
    }
    return null;
  }
};

exports.getCustomerByEmail = async function (email) {
  try {
    const customer = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    return customer.data.length > 0 ? customer.data[0] : null;
  } catch (error) {
    if (process.env.DEBUG_MODE === "TRUE") {
      console.error(`Error fetching customer by email ${email}: ${error}`);
    }
    return null;
  }
};

exports.createBillingPortalSession = async function (customerId, returnUrl) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  } catch (error) {
    if (process.env.DEBUG_MODE === "TRUE") {
      console.error(`Error creating billing portal session: ${error}`);
    }
    return null;
  }
};

exports.getPlans = async function (currentPlan, allowedSubscriptions) {
  try {
    let prices = await stripe.prices.list({ limit: 10 });
    let plans = prices.data.filter(
      (plan) =>
        plan.id !== currentPlan && allowedSubscriptions.includes(plan.id),
    );

    return plans.map((plan) => ({ id: plan.id, nickname: plan.nickname }));
  } catch (error) {
    if (process.env.DEBUG_MODE === "TRUE") {
      console.error(`Error fetching plans: ${error}`);
    }
    return null;
  }
};

exports.findOrCreateCustomer = async (stripe, email) => {
  const customers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  let customerId;
  if (customers.data.length > 0) {
    customerId = customers.data[0].id;
  } else {
    const customer = await stripe.customers.create({
      email: email,
    });
    customerId = customer.id;
  }

  return customerId;
};

exports.prepareSessionData = (
  priceId,
  customerId,
  trial_period_days,
  paymentMethod,
  protocol,
  host,
) => {
  const sessionData = {
    mode: "subscription",
    payment_method_types: [paymentMethod === "sepa" ? "sepa_debit" : "card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer: customerId,
    success_url: `${protocol}://${host}/checkout_success`,
    cancel_url: `${protocol}://${host}/checkout_error`,
  };

  if (trial_period_days !== null) {
    sessionData.subscription_data = {
      trial_period_days,
    };
  }

  return sessionData;
};

exports.findCustomer = async (stripe, email) => {
  const customers = await stripe.customers.list({ email: email, limit: 1 });
  return customers.data.length > 0 ? customers.data[0].id : null;
};

exports.updateSubscription = async (stripe, customerId, newPlanId) => {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
  });
  if (subscriptions.data.length > 0) {
    const currentSubscription = subscriptions.data[0];
    await stripe.subscriptions.update(currentSubscription.id, {
      cancel_at_period_end: false,
      proration_behavior: "create_prorations",
      items: [
        {
          id: currentSubscription.items.data[0].id,
          price: newPlanId,
        },
      ],
    });
  }
};

exports.cancelSubscriptionAtPeriodEnd = async (stripe, customerId) => {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
  });
  if (subscriptions.data.length > 0) {
    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });
  }
};

exports.undoCancelSubscription = async (stripe, customerId) => {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
  });
  if (subscriptions.data.length > 0) {
    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: false,
    });
  }
};

exports.adminCancelSubscription = async (stripe, customerId) => {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
  });
  for (const subscription of subscriptions.data) {
    await stripe.subscriptions.cancel(subscription.id);
  }
};

exports.fetchPaymentMethod = async function (paymentMethodId) {
  try {
    return await stripe.paymentMethods.retrieve(paymentMethodId);
  } catch (error) {
    if (process.env.DEBUG_MODE === "TRUE") {
      console.error(`Error fetching payment method ${paymentMethodId}: ${error}`);
    }
    return null;
  }
};

exports.fetchCustomerDefaultSubscription = async function (customerId) {
  try {
    const subscriptions = await stripe.subscriptions.list({ customer: customerId });
    // Assuming the first subscription is the default one
    return subscriptions.data[0];
  } catch (error) {
    if (process.env.DEBUG_MODE === "TRUE") {
      console.error(`Error fetching customer subscriptions for customerId ${customerId}: ${error}`);
    }
    return null;
  }
};