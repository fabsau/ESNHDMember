const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const admin = google.admin('directory_v1');
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

module.exports = (isAuthenticated) => {
    router.get('/', isAuthenticated, async (req, res) => {
        if (req.user.ou == process.env.GOOGLE_ADMIN_OU) {
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

                        // Fetch all subscriptions for the customer
                        const customerSubscriptions = await stripe.subscriptions.list({ customer: customerId });
                        const activeSubscription = customerSubscriptions.data.find(sub => sub.status === 'active');

                        // Fetch the payment history (invoices) for the customer
                        const invoices = await stripe.invoices.list({
                            customer: customerId,
                        });

                        // Add payment history to the user object
                        user.paymentHistory = invoices.data;

                        if (activeSubscription) {
                            user.subscription = activeSubscription;
                            user.planId = activeSubscription.items.data[0].price.id;
                            user.planDisplayName = planDisplayNames[user.planId];
                        } else if (user.paymentHistory && user.paymentHistory.length > 0) {
                            const cancelledSubscription = customerSubscriptions.data.find(sub => sub.ended_at != null);
                            if (cancelledSubscription) {
                                const cancellationDate = new Date(cancelledSubscription.ended_at * 1000).toISOString().slice(0, 10);
                                user.planDisplayName = 'Cancelled - ' + cancellationDate;
                            } else {
                                user.planDisplayName = 'Cancelled';
                            }
                        } else {
                            user.planDisplayName = 'Never Paid';
                        }
                    }
                }

                allUsers.push(...users.data.users);
                pageToken = users.data.nextPageToken;
            } while (pageToken);

            const stats = {
                totalUsers: allUsers.length,
                activeSubscriptions: allUsers.filter(user => user.subscription).length,
                member: allUsers.filter(user => user.planDisplayName === 'Member').length,
                alumni: allUsers.filter(user => user.planDisplayName === 'Alumni').length,
                noPlan: allUsers.filter(user => !user.subscription).length
            };

            res.render('admin', { users: allUsers, stats, signedIn: !!req.user, page: 'admin' });
        } else {
            res.status(403).send('Unauthorized');
        }
    });
    return router;
}
