module.exports = function(app, helmet) {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "cdn.jsdelivr.net"],
                imgSrc: ["'self'", "data:"],
                styleSrc: ["'self'", "cdn.jsdelivr.net"],
                fontSrc: ["'self'", "data:"],
                frameSrc: ["'self'"],
                connectSrc: ["'self'"],
                objectSrc: ["'none'"],
                formAction: ["'self'", "https://checkout.stripe.com"],
                upgradeInsecureRequests: []
            },
            referrerPolicy: { policy: "no-referrer" },
            xssFilter: true,
            noSniff: true
        },
        frameguard: { action: "deny" },
        hidePoweredBy: true
    }));

    if (process.env.ENABLE_HTTPS === 'TRUE') {
        app.use(helmet.hsts({
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }));
    }
};
