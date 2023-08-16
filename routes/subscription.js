const express = require('express');
const router = express.Router();

module.exports = function(stripe, isAuthenticated) {
    router.post("/buy", isAuthenticated, async(req, res) => {
        const {email} = req.user;
        const {priceId} = req.body;
        // Look for an existing customer
        const customers = await stripe.customers.list({
            email: email,
            limit: 1
        });
        let customerId;
        // If customer exists, get customer ID
        if (customers.data.length > 0) {
            customerId = customers.data[0].id;
            // Look for an existing subscription for this customer
            const subscriptions = await stripe.subscriptions.list({
                customer: customerId,
            });
            // If subscription exists, don't create a new one
            if (subscriptions.data.length > 0) {
                return res.status(400).send('You are already subscribed to a plan.');
            }
        } else {
            // if no existing customer, create a new one
            const customer = await stripe.customers.create({
                email: email,
            });
            customerId = customer.id;
        }
        // Define trial period for new member plan for first time subscribers
        let trial_period_days = null;
        if (req.body.trialEnabled === 'on') {
            trial_period_days = parseInt(process.env.TRIAL_LENGTHS_DAYS) || 0; /* map trial time */;
        }
        // Prepare the session data for creating the checkout session
        const sessionData = {
            mode: "subscription",
            payment_method_types: ['sepa_debit', 'card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            customer: customerId,
            success_url: `${process.env.ENABLE_HTTPS === 'TRUE' ? 'https://' : 'http://'}${process.env.BASE_URL}:${process.env.PORT}/checkout_success`,
            cancel_url: `${process.env.ENABLE_HTTPS === 'TRUE' ? 'https://' : 'http://'}${process.env.BASE_URL}:${process.env.PORT}/checkout_error`,
        };
        // Add trial period to session data if applicable
        if (trial_period_days !== null) {
            sessionData.subscription_data = {
                trial_period_days
            }
        }
        // Create the checkout session
        const session = await stripe.checkout.sessions.create(sessionData);
        // Redirect user to the checkout page
        res.redirect(303, session.url);
    });

    router.get("/checkout_success", isAuthenticated, (req, res) => {
        req.session.message = {type: 'success', text: 'Purchase was successful!'};
        res.redirect('/home');
    });

    router.get("/checkout_error", isAuthenticated, (req, res) => {
        req.session.message = {type: 'error', text: 'Something went wrong, please retry!'};
        res.redirect('/home');

    });
    router.post("/change-subscription", isAuthenticated, async(req, res) => {
        const {email} = req.user;
        const newPlanId = req.body.newPlanId;

        try {
            const customers = await stripe.customers.list({email: email, limit: 1});

            if (customers.data.length > 0) {
                const customerId = customers.data[0].id;
                const subscriptions = await stripe.subscriptions.list({customer: customerId});

                if (subscriptions.data.length > 0) {
                    const currentSubscription = subscriptions.data[0];
                    const currentPlanId = currentSubscription.items.data[0].price.id;

                    if (req.body.newPlanId === req.user.currentPlanId) {
                        req.session.message = {type: 'info', text: 'You selected the same subscription as your current one.'};
                        res.redirect('/home');
                        return;
                    }
                    await stripe.subscriptions.update(currentSubscription.id, {
                        cancel_at_period_end: false,
                        proration_behavior: 'create_prorations',
                        items: [{
                            id: currentSubscription.items.data[0].id,
                            price: newPlanId,
                        }]
                    });
                }
            }
            req.session.message = {type: 'success', text: 'Plan was successful changed!'};
            res.redirect('/home');
        } catch (error) {
            console.error('Error upgrading subscription:', error);
            req.session.message = {type: 'error', text: 'Error upgrading subscription, please refresh the page!'};
            res.redirect('/home');
        }
    });

    router.post("/cancel-subscription", isAuthenticated, async(req, res) => {
        const {email} = req.user;
        try {
            // Fetch customer details from Stripe
            const customer = await stripe.customers.list({
                email: email,
                limit: 1
            });
            if (customer.data.length > 0) {
                const customerId = customer.data[0].id;
                const subscriptions = await stripe.subscriptions.list({
                    customer: customerId
                });
                // Cancel the existing subscription
                if (subscriptions.data.length > 0) {
                    await stripe.subscriptions.del(subscriptions.data[0].id);
                }
            }
            // Redirect to the home page with a successful cancellation message
            req.session.message = {type: 'success', text: 'Cancellation was successful!'};
            res.redirect('/home');
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            // On error, redirect to the home page
            req.session.message = {type: 'error', text: 'Error cancelling subscription, please refresh the page!'};
            res.redirect('/home');
        }
    });

    return router;
};
