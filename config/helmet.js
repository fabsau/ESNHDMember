module.exports = function (app, helmet) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          scriptSrc: ["'self'"],
          scriptSrcAttr: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          styleSrc: ["'self'"],
          fontSrc: ["'self'", "data:"],
          frameSrc: ["'none'"],
          frameAncestors: ["'none'"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          formAction: ["'self'", "https://checkout.stripe.com"],
          upgradeInsecureRequests: [],
          blockAllMixedContent: [],
          baseUri: ["'none'"],
        },
        referrerPolicy: { policy: "no-referrer" },
        xssFilter: true,
        noSniff: true,
        crossOriginEmbedderPolicy: true,
      },
      frameguard: { action: "deny" },
      hidePoweredBy: true,
    }),
  );

  app.use(helmet.crossOriginEmbedderPolicy());

  if (process.env.ENABLE_HTTPS === "TRUE") {
    app.use(
      helmet.hsts({
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      }),
    );
  }
};
