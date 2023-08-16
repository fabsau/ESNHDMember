// ========================================
// Import the necessary packages
// ========================================
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var session = require('express-session');
var csurf = require('@dr.pogodin/csurf');
const helmet = require('helmet');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_API_KEY);
var rateLimit = require('express-rate-limit');
var ExpressBrute = require('express-brute');
var Ddos = require('ddos');
var app = express();

// ========================================
// Setup Express App (View Engine + Middlewares)
// ========================================
// View Engine Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Setting up middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
if (process.env.ENABLE_RATE_LIMITING === 'TRUE') {
    var limiter = rateLimit({
        windowMs: Number(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // default is 15 minutes
        max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // default limit is 100 requests per windowMs
    });
    app.use(limiter);
}

// ExpressBrute setup
if (process.env.ENABLE_DDOS_PROTECTION === 'TRUE') {
    var store = new ExpressBrute.MemoryStore(); // stores state locally, you might want a different store for clustered environment
    var bruteforce = new ExpressBrute(store, {
        freeRetries: Number(process.env.DDOS_FREE_RETRIES) || 50,
        minWait: Number(process.env.DDOS_MIN_WAIT) * 60 * 1000 || 5 * 60 * 1000,  // default is 5 minutes
        maxWait: Number(process.env.DDOS_MAX_WAIT) * 60 * 1000 || 60 * 60 * 1000,  // default is 1 hour
        failCallback: ExpressBrute.FailTooManyRequests
    });
    var ddosConfig = new Ddos({
        burst: Number(process.env.DDOS_BURST) || 10,
        limit: Number(process.env.DDOS_LIMIT) || 15
    });
    app.use(ddosConfig.express);
    // Use ExpressBrute middleware just before your main routes
    app.all('/*', bruteforce.prevent, function (req, res, next) {
        next(); // continue to next routes
    });
}

// ========================================
// Setup Session and Passport for Authentication through Google
// ========================================
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, function (accessToken, refreshToken, profile, cb) {
    // Extract first and last name from the profile
    const {given_name, family_name, email} = profile._json;

    // Create a user object with the required properties
    const user = {
        id: profile.id,
        displayName: profile.displayName,
        givenName: given_name,
        familyName: family_name,
        email: email
    };
    return cb(null, user);
}));

// Initialize session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true, // Only accessible through HTTP(S)
        secure: process.env.ENABLE_HTTPS === 'TRUE', // Only set with https enabled
    }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Serialize user
passport.serializeUser((user, cb) => {
    cb(null, user);
});

// Deserialize user
passport.deserializeUser((obj, cb) => {
    cb(null, obj);
});

// ========================================
// Setup Security (helmet, HSTS, CSRF)
// ========================================
// Helmet for secure headers in the HTTP response
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'cdn.jsdelivr.net'],
            imgSrc: ["'self'", 'data:'],
            styleSrc: ["'self'", 'cdn.jsdelivr.net'],
            fontSrc: ["'self'", "data:"],
            frameSrc: ["'self'"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            formAction: ["'self'", 'https://checkout.stripe.com'],
            upgradeInsecureRequests: [],
        },
        referrerPolicy: {policy: 'no-referrer'},
        xssFilter: true, // adds X-XSS-Protection
        noSniff: true, // adds X-Content-Type-Options
    },
    frameguard: {action: 'deny'}, // adds X-Frame-Options
    hidePoweredBy: true, // hides X-Powered-By
}));
// Set HTTP Strict Transport Security (HSTS) if https is enabled
if (process.env.ENABLE_HTTPS === 'TRUE') {
    app.use(helmet.hsts({ // adds Strict-Transport-Security
        maxAge: 60 * 60 * 24 * 365, // 1 year
        includeSubDomains: true,
        preload: true
    }));
}
// Set up CSRF protection
app.use(csurf());
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

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

// ========================================
// Start application
// ========================================
module.exports = app;