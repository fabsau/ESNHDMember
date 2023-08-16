const https = require("https");
const letsencrypt = require("./letsencrypt");
const certificates = require("./certificates");

module.exports = {
    createHttpsServer: (app) => {
        let server;

        if (process.env.CERT_METHOD === "LETSENCRYPT") {
            server = letsencrypt.init(app);
        } else if (process.env.CERT_METHOD === "SELFSIGN" || process.env.CERT_METHOD === "CUSTOM") {
            const sslOptions = certificates.getSslOptions();
            server = https.createServer(sslOptions, app);
        }

        return server;
    }
};
