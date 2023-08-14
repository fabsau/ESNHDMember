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


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'cdn.jsdelivr.net', 'ajax.googleapis.com', 'checkout.stripe.com'],
            imgSrc: ["'self'", 'data:', 'checkout.stripe.com'],
            styleSrc: ["'self'", 'cdn.jsdelivr.net', 'checkout.stripe.com'],
            fontSrc: ["'self'", 'fonts.gstatic.com', "data:"],
            frameSrc: ["'self'", 'checkout.stripe.com', 'accounts.google.com'],
            connectSrc: ["'self'", 'api.stripe.com', 'accounts.google.com'],
            objectSrc: ["'none'"],
            formAction: ["'self'", `${process.env.PROTOCOL}://${process.env.BASE_URL}`],
            upgradeInsecureRequests: [],
        },
        referrerPolicy: { policy: 'no-referrer' },
        xssFilter: true, // adds X-XSS-Protection
        noSniff: true, // adds X-Content-Type-Options
    },
    frameguard: { action: 'deny' }, // adds X-Frame-Options
    hidePoweredBy: true, // hides X-Powered-By
}));

if (process.env.PROTOCOL === 'https') {
    app.use(helmet.hsts({ // adds Strict-Transport-Security
        maxAge: 60 * 60 * 24 * 365, // 1 year
        includeSubDomains: true,
        preload: true
    }));
}

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, function(accessToken, refreshToken, profile, cb) {
    // Extract first and last name from the profile
    const { given_name, family_name, email, picture } = profile._json;

    // Create a user object with the required properties
    const user = {
        id: profile.id,
        displayName: profile.displayName,
        givenName: given_name,
        familyName: family_name,
        email: email,
        picture: picture
    };
    return cb(null, user);
}));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true, // Only accessible through HTTP(S)
        secure: process.env.PROTOCOL === 'https', // Only set in production
        sameSite: process.env.PROTOCOL === 'https' ? 'strict' : 'lax' // Set to 'strict' in production
    }
}));

if (process.env.CSRF === 'TRUE') {
    app.use(csurf());
    app.use((req, res, next) => {
        res.locals.csrfToken = req.csrfToken();
        next();
    });
}
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((obj, cb) => {
    cb(null, obj);
});

app.get('/', (req, res) => {
    if (req.user) {
        res.redirect('/home');
    } else {
        res.render('loginpage');
    }
});

app.get('/home', ensureAuthenticated, async function(req, res) {
    const { givenName, familyName, email, picture, id } = req.user;

    try {
        const customer = await stripe.customers.list({
            email: email,
            limit: 1
        });

        let customerUrl;
        let subscription;
        if (customer.data.length > 0) {
            const customerId = customer.data[0].id;

            // Retrieve the customer's subscriptions
            const subscriptions = await stripe.subscriptions.list({
                customer: customerId
            });

            if (subscriptions.data.length > 0) {
                subscription = subscriptions.data[0];
            }

            const session = await stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: `${process.env.PROTOCOL}://${process.env.BASE_URL}/home`
            });
            customerUrl = session.url;
        }

        let successMessage = null;
        let cancelMessage = null;

        // Check if the query parameter exists and set the corresponding message
        if (req.query.purchase === 'success') {
            successMessage = 'Purchase was successful!';
        }
        if (req.query.cancel === 'success') {
            cancelMessage = 'Cancellation was successful!';
        }

        const renderOptions = {
            user: req.user,
            firstName: givenName,
            lastName: familyName,
            email: email,
            picture: picture,
            userId: id,
            customerUrl: customerUrl,
            subscription: subscription,
            successMessage: successMessage,
            cancelMessage: cancelMessage
        };
        res.render('home', renderOptions);

    } catch (error) {
        console.log('Error retrieving customer:', error);
        res.redirect('/');
    }
});


app.get('/login',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect to home.
        res.redirect('/home');
    });

app.post('/logout', function(req, res) {
    req.logout(function(err) {
        if (err) {
            console.log(err);
        }
        req.session.destroy(function(err) {
            if (err) {
                console.log(err);
            }
            res.redirect('/');
        });
    });
});

app.post('/create-checkout-session', ensureAuthenticated, async (req, res) => {
    const { email } = req.user;
    const { priceId } = req.body;

    // Look for an existing customer
    const customers = await stripe.customers.list({
        email: email,
        limit: 1
    });
    let customerId;
    if (customers.data.length > 0) {
        customerId = customers.data[0].id;

        // Look for an existing subscription for this customer
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
        });

        if (subscriptions.data.length > 0) {
            // Don't create a new subscription if one already exists
            return res.status(400).send('You are already subscribed to a plan.');
        }
    } else {
        // if no existing customer, create a new one
        const customer = await stripe.customers.create({
            email: email,
        });
        customerId = customer.id;
    }

    let trial_period_days = null;
    if (priceId === process.env.SUBSCRIPTION_PRICE_ID_1) {
        trial_period_days = 180; // 6 months trial period
    }

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
        success_url: `${process.env.PROTOCOL}://${process.env.BASE_URL}/home?purchase=success`,
        cancel_url: `${process.env.PROTOCOL}://${process.env.BASE_URL}/home`,
    };

    if(trial_period_days !== null) {
        sessionData.subscription_data = {
            trial_period_days
        }
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    res.redirect(303, session.url);
});

app.post('/cancel-subscription', ensureAuthenticated, async (req, res) => {
    const { email } = req.user;

    try {
        const customer = await stripe.customers.list({
            email: email,
            limit: 1
        });

        if (customer.data.length > 0) {
            const customerId = customer.data[0].id;
            const subscriptions = await stripe.subscriptions.list({
                customer: customerId
            });

            if (subscriptions.data.length > 0) {
                await stripe.subscriptions.del(subscriptions.data[0].id);
            }
        }

        res.redirect('/home?cancel=success');
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.redirect('/home');
    }
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res) {

    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');

});

module.exports = app;
