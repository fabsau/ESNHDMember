const createError = require("http-errors");
const authRoutes = require('./auth');
const homeRoutes = require('./home');
const subscriptionRoutes = require('./subscription');
const logoutRoutes = require('./logout');
const healthcheckRoutes = require('./healthcheck');
const errorRoutes = require('./error');

module.exports = function(app, passport, stripe, isAuthenticated) {
    app.use('/', authRoutes(passport));
    app.use('/home', homeRoutes(stripe, isAuthenticated));
    app.use('/', subscriptionRoutes(stripe, isAuthenticated));
    app.use('/logout', logoutRoutes());
    app.use('/healthcheck', healthcheckRoutes());
    app.use('/', errorRoutes(createError));
};