const express = require('express');
const router = express.Router();

module.exports = function(stripe, isAuthenticated) {
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
                    await stripe.subscriptions.cancel(subscriptions.data[0].id);
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

    router.post("/admin-cancel-subscription", isAuthenticated, async (req, res) => {
        const { email } = req.body;

        try {
            const customers = await stripe.customers.list({ email: email, limit: 1 });

            if (customers.data.length > 0) {
                const customerId = customers.data[0].id;
                const subscriptions = await stripe.subscriptions.list({ customer: customerId });

                for (const subscription of subscriptions.data) {
                    await stripe.subscriptions.cancel(subscription.id);
                }
            }

            res.json({ message: 'Cancellation was successful!' });

        } catch (error) {
            console.error('Error cancelling subscription:', error);
            res.status(500).json({ message: 'Error cancelling subscription. Please try again.' });
        }
    });



    return router;
};
