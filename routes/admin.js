const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const admin = google.admin('directory_v1');
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

module.exports = (isAuthenticated) => {
    router.get('/', isAuthenticated, async (req, res) => {
        if (req.user.ou.startsWith == process.env.GOOGLE_ADMIN_OU) {
            // Define your subscription plan ids
            const planDisplayNames = {
                [process.env.SUBSCRIPTION_PRICE_ID_MEMBER_6MONTHS]: 'Member',
                [process.env.SUBSCRIPTION_PRICE_ID_ALUMNI_6MONTHS]: 'Alumni'
            };

            // Fetch all subscriptions for each plan and create a map with customer id as key and subscription details as value
            const customerSubscriptionsMap = new Map();
            for (const planId in planDisplayNames) {
                let hasMore;
                let startAfterId;
                do {
                    const subscriptions = await stripe.subscriptions.list({
                        price: planId,
                        status: 'active',
                        starting_after: startAfterId
                    });

                    for (const subscription of subscriptions.data) {
                        customerSubscriptionsMap.set(subscription.customer, subscription);
                    }

                    hasMore = subscriptions.has_more;
                    if (subscriptions.data.length > 0) {
                        startAfterId = subscriptions.data[subscriptions.data.length - 1].id;
                    }
                } while (hasMore);
            }

// Now fetch all customers
            const customerEmailIdMap = new Map();
            let hasMore;
            let startAfterId;
            do {
                const customers = await stripe.customers.list({
                    starting_after: startAfterId
                });

                for (const customer of customers.data) {
                    if (customer.email) {
                        customerEmailIdMap.set(customer.email, customer.id);
                    }
                }

                hasMore = customers.has_more;
                if (customers.data.length > 0) {
                    startAfterId = customers.data[customers.data.length - 1].id;
                }
            } while (hasMore);

            let allUsers = [];
            let pageToken;
            do {
                let users;
                try {
                    users = await admin.users.list({
                        domain: process.env.GOOGLE_ADMIN_DOMAIN,
                        maxResults: 100,
                        pageToken: pageToken
                    });
                } catch (err) {
                    console.log('Error fetching user list: ', err);
                    return res.status(500).send('Error fetching user list');
                }

                for (let user of users.data.users) {
                    // Get the Stripe customer id using the user's email
                    const customerId = customerEmailIdMap.get(user.primaryEmail);
                    if (customerId) {
                        // Get the subscription using the customer id
                        const subscription = customerSubscriptionsMap.get(customerId);
                        if (subscription) {
                            user.subscription = subscription;
                            user.planId = subscription.items.data[0].price.id;
                            user.planDisplayName = planDisplayNames[user.planId];
                        }
                    }
                }

                allUsers.push(...users.data.users);
                pageToken = users.data.nextPageToken;
            } while (pageToken);

            res.render('admin', { users: allUsers, signedIn: !!req.user, page: 'admin' });
        } else {
            res.status(403).send('Unauthorized');
        }
    });
    return router;
}
