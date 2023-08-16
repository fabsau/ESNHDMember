const express = require('express');
const router = express.Router();

module.exports = function(stripe, isAuthenticated) {
    router.get("/", isAuthenticated, async function(req, res) {
        // Destructure details of the user from the Google Signin
        const {givenName, familyName, email} = req.user;
        // defined subscription ids allowed to see
        const allowedSubscriptions = [
            process.env.SUBSCRIPTION_PRICE_ID_MEMBER,
            process.env.SUBSCRIPTION_PRICE_ID_ALUMNI
        ];
        try {
            // Fetch customer details from Stripe based on email
            const customer = await stripe.customers.list({
                email: email,
                limit: 1
            });
            let customerUrl;
            let subscription;
            let currentPlan;
            // Check if customer data is present
            if (customer.data.length > 0) {
                const customerId = customer.data[0].id;
                const subscriptions = await stripe.subscriptions.list({ customer: customerId });
                // Retrieve the list of subscriptions of the customer
                if (subscriptions.data.length > 0) {
                    subscription = subscriptions.data[0];
                    currentPlan = subscriptions.data[0].items.data[0].price.id;
                } else {
                    // set currentPlan to null if no subscriptions
                    currentPlan = null;
                }
                // Create a billing portal session for the customer
                const session = await stripe.billingPortal.sessions.create({
                    customer: customerId,
                    return_url: `${req.protocol}://${req.get('host')}/home`
                });
                customerUrl = session.url;
            }

            // get all plans except the current one
            let prices = await stripe.prices.list({limit: 10});
            let plans = prices.data.filter(plan => plan.id !== currentPlan && allowedSubscriptions.includes(plan.id));
            plans = plans.map(plan => ({id: plan.id, nickname: plan.nickname}));

            // passing the renderOptions
            const renderOptions = {
                user: req.user,
                firstName: givenName,
                lastName: familyName,
                email: email,
                customerUrl: customerUrl,
                subscription: subscription,
                plans: plans
            };
            renderOptions.message = req.session.message;
            req.session.message = null;
            res.render('home', renderOptions);
        } catch (error) {
            console.log('Error retrieving customer:', error);
            res.redirect('/');
        }
    });

    return router;
};
