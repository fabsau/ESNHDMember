module.exports = function(app, csurf) {
    app.use(csurf());
    app.use((req, res, next) => {
        res.locals.csrfToken = req.csrfToken();
        next();
    });
};