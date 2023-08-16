const ExpressBrute = require('express-brute');
const Ddos = require('ddos');

module.exports = function(app) {
    if (process.env.ENABLE_DDOS_PROTECTION === 'TRUE') {
        const store = new ExpressBrute.MemoryStore();
        const bruteforce = new ExpressBrute(store, {
            freeRetries: Number(process.env.DDOS_FREE_RETRIES) || 50,
            minWait: 60 * 1000 * Number(process.env.DDOS_MIN_WAIT) || 300000,
            maxWait: 60 * 1000 * Number(process.env.DDOS_MAX_WAIT) || 3600000,
            failCallback: ExpressBrute.FailTooManyRequests
        });
        const ddos = new Ddos({
            burst: Number(process.env.DDOS_BURST) || 10,
            limit: Number(process.env.DDOS_LIMIT) || 15
        });
        app.use(ddos.express);
        app.all('/*', bruteforce.prevent, function(req, res, next) { next(); });
    }
};
