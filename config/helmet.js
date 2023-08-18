module.exports = function(app, helmet) {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "https://cdn.jsdelivr.net/npm/@popperjs/core@2/dist/umd/popper.min.js", "https://cdn.jsdelivr.net/npm/bootstrap@5/dist/js/bootstrap.min.js"],
                imgSrc: ["'self'", "data:"],
                styleSrc: ["'self'", "https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css", "https://cdn.jsdelivr.net/npm/bootstrap-icons@1/font/bootstrap-icons.css"],
                fontSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
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
