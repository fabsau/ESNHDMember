const express = require("express");
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { jwtClient } = require('../config/passport');
const mail = require('../config/mail')(jwtClient);

module.exports = function(stripe) {
    // Send a test email when the application starts
    mail.sendEmail('Test email', '<p>This is a test email sent on application startup.</p>', 'fabio@esn-heidelberg.de');

    router.post(
        "/webhook",
        express.raw({ type: "application/json" }),
        async (req, res) => {
            let event;

            try {
                event = stripe.webhooks.constructEvent(
                    req.body,
                    req.headers["stripe-signature"],
                    process.env.STRIPE_WEBHOOK_SECRET
                );
            } catch (err) {
                console.error(`Webhook Error: ${err.message}`);
                res.status(400).send(`Webhook Error: ${err.message}`);
                return;
            }

            const { type, data } = event;
            const object = data.object;

            // Retrieve customer email from Stripe
            const customer = await stripe.customers.retrieve(object.customer);
            const customerEmail = customer.email;

            // Read the email body from a file in the /emails/ directory
            const emailPath = path.join(__dirname, '/emails/', `${type}.txt`);
            const emailBody = fs.existsSync(emailPath) ? fs.readFileSync(emailPath, 'utf8') : '';

            switch (type) {
                case "checkout.session.completed":
                    console.log("Checkout session completed");
                    mail.sendEmail('Your purchase was successful', emailBody, customerEmail);
                    break;
                case "invoice.upcoming":
                    console.log("Invoice upcoming");
                    // Add logic to check the date and send an email 14 days before the next invoice
                    break;
                case "customer.subscription.updated":
                    console.log("Subscription updated");
                    // Add logic to send a renewal or switch confirmation email
                    break;
                case "customer.subscription.deleted":
                    console.log("Subscription deleted");
                    mail.sendEmail('Subscription cancelled', emailBody, customerEmail);
                    break;
                case "invoice.payment_failed":
                    console.log("Payment failed");
                    mail.sendEmail('Payment failed', emailBody, customerEmail);
                    break;
                case "charge.failed":
                    console.log("Charge failed");
                    mail.sendEmail('Charge failed', emailBody, customerEmail);
                    break;
                case "customer.subscription.trial_will_end":
                    console.log("Trial will end");
                    mail.sendEmail('Trial ending soon', emailBody, customerEmail);
                    break;
                case "customer.source.expiring":
                    console.log("Source expiring");
                    mail.sendEmail('Card expiring soon', emailBody, customerEmail);
                    break;
                default:
                    console.log("Unexpected event type");
                    return res.status(400).end();
            }

            // Return a response to acknowledge receipt of the event
            res.json({ received: true });
        }
    );

    return router;
};
