const express = require('express');
const router = express.Router();

module.exports = function(stripe, isAuthenticated) {
    router.post("/purchase", isAuthenticated, async(req, res) => {
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
            trial_period_days = parseInt(process.env.TRIAL_LENGTHS_DAYS) || 0; /* map trial time */
        }
        // Prepare the session data for creating the checkout session
        const sessionData = {
            mode: "subscription",
            payment_method_types: [req.body.paymentMethod === 'sepa' ? 'sepa_debit' : 'card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            customer: customerId,
            success_url: `${req.protocol}://${req.get('host')}/checkout_success`,
            cancel_url: `${req.protocol}://${req.get('host')}/checkout_error`,
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

    return router;
};
