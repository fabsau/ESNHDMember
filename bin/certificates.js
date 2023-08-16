const fs = require('fs');
const selfsigned = require('selfsigned');

module.exports = {
    getSslOptions: () => {
        let sslOptions;
        if (process.env.CERT_METHOD === "SELFSIGN") {
            sslOptions = module.exports.generateCertificates(); // Updated this line
        } else if (process.env.CERT_METHOD === "CUSTOM") {
            try {
                sslOptions = {
                    key: fs.readFileSync(process.env.CUSTOM_CERT_KEY_FILE_PATH || './cert/custom/key.pem'),
                    cert: fs.readFileSync(process.env.CUSTOM_CERT_FILE_PATH || './cert/custom/cert.pem'),
                    port: normalizePort(process.env.PORT || "3000")
                };
            } catch (error) {
                console.error('Unable to read HTTPS credentials:', error.message);
                return;
            }
        }
        return sslOptions;
    },

    generateCertificates: () => {
        const keyPath = './cert/selfsigned/key.pem';
        const certPath = './cert/selfsigned/cert.pem';

        if (!fs.existsSync(certPath)) {
            console.log("Certificate not found, generating a new one...");
            const attrs = [{ name: 'commonName', value: 'localhost' }];
            const pems = selfsigned.generate(attrs, { days: 365 });

            if (!fs.existsSync('/cert/selfsigned')) fs.mkdirSync('./cert/selfsigned');

            fs.writeFileSync(keyPath, pems.private);
            fs.writeFileSync(certPath, pems.cert);
            console.log("SSL certificate generated...");
        } else {
            console.log("SSL certificate found");
        }

        return {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath)
        }
    }
};