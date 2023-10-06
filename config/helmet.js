module.exports = function (app, helmet) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "https://cdn.jsdelivr.net/npm/@popperjs/core@2/dist/umd/popper.min.js",
            "https://cdn.jsdelivr.net/npm/bootstrap@5/dist/js/bootstrap.min.js",
            "https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.min.js",
            "https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js",
            "https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js",
            "https://cdn.datatables.net/buttons/2.4.2/js/dataTables.buttons.min.js",
            "https://cdn.datatables.net/buttons/2.4.2/js/buttons.bootstrap5.min.js",
            "https://cdn.datatables.net/colreorder/1.7.0/js/dataTables.colReorder.min.js",
            "https://cdn.datatables.net/buttons/2.4.1/js/buttons.colVis.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/yadcf/0.9.4/jquery.dataTables.yadcf.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/js/select2.min.js",
            "https://cdn.datatables.net/buttons/2.4.1/js/buttons.print.min.js",
            "https://cdn.datatables.net/buttons/2.4.1/js/buttons.html5.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
          ],
          scriptSrcAttr: ["'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          styleSrc: [
            "'self'",
            "https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css",
            "https://cdn.jsdelivr.net/npm/bootstrap-icons@1/font/bootstrap-icons.css",
            "https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css",
            "https://cdn.datatables.net/buttons/2.4.2/css/buttons.bootstrap5.min.css",
            "https://cdn.datatables.net/colreorder/1.7.0/css/colReorder.bootstrap5.min.css",
            "https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/css/select2.min.css",
          ],
          fontSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
          frameSrc: ["'self'"],
          frameAncestors: ["'none'"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          formAction: ["'self'", "https://checkout.stripe.com"],
          upgradeInsecureRequests: [],
        },
        referrerPolicy: { policy: "no-referrer" },
        xssFilter: true,
        noSniff: true,
      },
      frameguard: { action: "deny" },
      hidePoweredBy: true,
    }),
  );

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
