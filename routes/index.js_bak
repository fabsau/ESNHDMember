module.exports = function(app, passport, stripe, ensureAuthenticated) {
    // ========================================
// Define Routes
// ========================================
// Define route for index page '/'
    app.get('/', (req, res) => {
        // Check if user is logged in
        if (req.user) {
            // If user is logged in, redirect to home page
            res.redirect('/home');
        } else {
            // If user is not logged in, render the login page
            res.render('login');
        }
    });

// Define route for Google OAuth
    app.get('/login',
        // Invoke Google strategy from Passport.js
        passport.authenticate('google', {scope: ['profile', 'email']}));

// Callback route for Google OAuth
    app.get('/auth/google/callback',
        passport.authenticate('google', {failureRedirect: '/login'}),
        function (req, res) {
            // On successful authentication, redirect to home
            res.redirect('/home');
        });

// Check if user is authenticated otherwise redirect to
    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/');
    }
// Define route for home page '/home'
    app.get('/home', ensureAuthenticated, async function (req, res) {
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
                    return_url: `${process.env.ENABLE_HTTPS === 'TRUE' ? 'https://' : 'http://'}${process.env.BASE_URL}:${process.env.PORT}/home`
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

// Define route for creating a checkout session for Stripe payments
    app.post('/buy', ensureAuthenticated, async (req, res) => {
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
// Route for checkout success
    app.get('/checkout_success', ensureAuthenticated, (req, res) => {
        req.session.message = {type: 'success', text: 'Purchase was successful!'};
        res.redirect('/home');
    });

// Route for checkout error
    app.get('/checkout_error', ensureAuthenticated, (req, res) => {
        req.session.message = {type: 'error', text: 'Something went wrong, please retry!'};
        res.redirect('/home');
    });


// Define route to change subscription
    app.post('/change-subscription', ensureAuthenticated, async (req, res) => {
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
// Define route to cancel a subscription
    app.post('/cancel-subscription', ensureAuthenticated, async (req, res) => {
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

// Define route for logout
    app.post('/logout', function (req, res) {
        // Terminate user session
        req.logout(function (err) {
            if (err) {
                console.log(err);
            }
            // Destroy session
            req.session.destroy(function (err) {
                if (err) {
                    console.log(err);
                }
                // Upon logout, redirect to the index page
                res.redirect('/');
            });
        });
    });

//Healthcheck Endpoint
    app.get('/healthcheck', (req, res) => res.sendStatus(200));

// ========================================
// Error handling (404 and other errors)
// ========================================
// Handle 404
    app.use(function (req, res, next) {
        next(createError(404));
    });

// Handle other errors
    app.use(function (err, req, res) {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};
        // render the error page
        res.status(err.status || 500);
        res.render('error');
    });
};