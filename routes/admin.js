const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const admin = google.admin('directory_v1');
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

async function fetchSubscriptions(planId, startAfterId) {
    try {
        return await stripe.subscriptions.list({
            price: planId,
            status: 'active',
            starting_after: startAfterId
        })
    } catch (error) {
        console.error(`Error fetching subscriptions for planId ${planId}: ${error}`);
        return null;
    }
}

async function fetchCustomers(startAfterId) {
    try {
        return await stripe.customers.list({
            starting_after: startAfterId
        })
    } catch (error) {
        console.error(`Error fetching customers: ${error}`);
        return null;
    }
}

async function fetchUsers(pageToken) {
    try {
        return await admin.users.list({
            domain: process.env.GOOGLE_ADMIN_DOMAIN,
            maxResults: 100,
            pageToken: pageToken
        });
    } catch (error) {
        console.error(`Error fetching user list: ${error}`);
        return null;
    }
}

async function fetchCustomerSubscriptions(customerId) {
    try {
        return await stripe.subscriptions.list({ customer: customerId });
    } catch (error) {
        console.error(`Error fetching customer subscriptions for customerId ${customerId}: ${error}`);
        return null;
    }
}

async function fetchInvoices(customerId) {
    try {
        return await stripe.invoices.list({ customer: customerId });
    } catch (error) {
        console.error(`Error fetching invoices for customerId ${customerId}: ${error}`);
        return null;
    }
}

async function fetchAllSubscriptions(planDisplayNames) {
    const customerSubscriptionsMap = new Map();
    for (const planId in planDisplayNames) {
        let hasMore;
        let startAfterId;
        do {
            const subscriptions = await fetchSubscriptions(planId, startAfterId);
            if (!subscriptions) continue;

            subscriptions.data.forEach(subscription => customerSubscriptionsMap.set(subscription.customer, subscription));
            hasMore = subscriptions.has_more;
            if (subscriptions.data.length > 0) startAfterId = subscriptions.data[subscriptions.data.length - 1].id;
        } while (hasMore);
    }
    return customerSubscriptionsMap;
}

async function fetchAllCustomers() {
    const customerEmailIdMap = new Map();
    let hasMore;
    let startAfterId;
    do {
        const customers = await fetchCustomers(startAfterId);
        if (!customers) continue;

        customers.data.forEach(customer => customer.email && customerEmailIdMap.set(customer.email, customer.id));
        hasMore = customers.has_more;
        if (customers.data.length > 0) startAfterId = customers.data[customers.data.length - 1].id;
    } while (hasMore);
    return customerEmailIdMap;
}

const planDisplayNames = {
    [process.env.SUBSCRIPTION_PRICE_ID_MEMBER_6MONTHS]: 'Member',
    [process.env.SUBSCRIPTION_PRICE_ID_ALUMNI_6MONTHS]: 'Alumni'
};

async function fetchActiveCustomerSubscription(customerId) {
    try {
        const customerSubscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'active' });
        return customerSubscriptions.data[0];
    } catch (error) {
        console.error(`Error fetching active subscription for customerId ${customerId}: ${error}`);
        return null;
    }
}

module.exports = (isAuthenticated) => {
    router.get('/', isAuthenticated, async (req, res) => {
        if (req.user.ou == process.env.GOOGLE_ADMIN_OU) {
            const customerSubscriptionsMap = await fetchAllSubscriptions(planDisplayNames);
            const customerEmailIdMap = await fetchAllCustomers();

            let allUsers = [];
            let stats = { totalUsers: 0, activeSubscriptions: 0, member: 0, alumni: 0, cancelled: 0, noPlan: 0 };
            let pageToken;
            do {
                const users = await fetchUsers(pageToken);
                if (!users) continue;

                for (let user of users.data.users) {
                    const customerId = customerEmailIdMap.get(user.primaryEmail);
                    if (customerId) {
                        const [activeSubscription, invoices] = await Promise.all([
                            fetchActiveCustomerSubscription(customerId),
                            fetchInvoices(customerId)
                        ]);

                        user.paymentHistory = invoices.data;

                        if (activeSubscription) {
                            stats.activeSubscriptions++;
                            user.subscription = activeSubscription;
                            user.planId = activeSubscription.items.data[0].price.id;
                            user.planDisplayName = planDisplayNames[user.planId];
                            if (user.planDisplayName === 'Member') stats.member++;
                            if (user.planDisplayName === 'Alumni') stats.alumni++;
                        } else if (user.paymentHistory && user.paymentHistory.length > 0) {
                            user.planDisplayName = 'Cancelled';
                            stats.cancelled++;
                        } else {
                            user.planDisplayName = 'Never Paid';
                        }
                    } else {
                        stats.noPlan++;
                    }
                }

                allUsers.push(...users.data.users);
                stats.totalUsers += users.data.users.length;
                pageToken = users.data.nextPageToken;
            } while (pageToken);

            res.render('admin', { users: allUsers, stats, signedIn: !!req.user, page: 'admin' });
        } else {
            res.status(403).send('Unauthorized');
        }
    });
    return router;
}
