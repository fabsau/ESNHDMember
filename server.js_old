const http = require('http');
const https = require('https');
const selfsigned = require('selfsigned');
const fs = require('fs');
const greenlockExpress = require('greenlock-express');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');
const parentDir = path.dirname(__dirname);

module.exports = async function(app, port) {
    let server;

    if (process.env.ENABLE_HTTPS === "TRUE") {
        if (process.env.CERT_METHOD === "LETSENCRYPT") {
            let subject = process.env.LETSENCRYPT_SUBJECT;
            let altnames = process.env.LETSENCRYPT_ALTNAMES;
            await addLetsEncryptCertificate(subject, altnames);
            server = http.createServer(app); // Create a placeholder server
            greenlockExpress.init({
                packageRoot: parentDir,
                configDir: process.env.CONFIG_DIR || "./cert/greenlock",
                maintainerEmail: process.env.LETSENCRYPT_EMAIL,
                cluster: false
            }).serve(app);
            console.log("Greenlock's server started");
        } else if (process.env.CERT_METHOD === "SELFSIGN") {
            const sslOptions = generateCertificates();
            server = https.createServer(sslOptions, app);
        } else if (process.env.CERT_METHOD === "CUSTOM") {
            try {
                let sslOptions = {
                    key: fs.readFileSync(process.env.CUSTOM_CERT_KEY_FILE_PATH || './cert/custom/key.pem'),
                    cert: fs.readFileSync(process.env.CUSTOM_CERT_FILE_PATH || './cert/custom/cert.pem'),
                    port: port
                };
                server = https.createServer(sslOptions, app);
            } catch (error) {
                console.error('Unable to read HTTPS credentials:', error.message);
                return;
            }
        }
    } else {
        server = http.createServer(app);
    }

    return server;
}

/**
 * Certificate generation function.
 */
function generateCertificates() {
    const keyPath = process.env.SELFSIGNED_KEY_PATH || './cert/selfsigned/key.pem';
    const certPath = process.env.SELFSIGNED_CERT_PATH || './cert/selfsigned/cert.pem';
    const certValidityDays = process.env.SELFSIGNED_VALIDITY_DAYS || 365;
    const certCommonName = process.env.SELFSIGNED_COMMON_NAME || 'localhost';
    const certAltNames = process.env.SELFSIGNED_ALT_NAMES ? process.env.SELFSIGNED_ALT_NAMES.split(',') : [];

    const attrs = [{ name: 'commonName', value: certCommonName }];

    const pems = selfsigned.generate(attrs, { days: certValidityDays, altNames: certAltNames });

    if (!fs.existsSync(certPath)) {
        console.log("Certificate not found, generating new one...");

        // Ensuring the directories exist before writing the files.
        if (!fs.existsSync(path.dirname(certPath))) fs.mkdirSync(path.dirname(certPath), { recursive: true });

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


/**
 * LetsEncrypt certificate generation function.
 */
async function addLetsEncryptCertificate(subject, altnames) {
    let cmd = `npx greenlock add --subject ${subject} --altnames ${altnames}`;
    try {
        const { stdout, stderr } = await exec(cmd);
        console.log(`stdout: ${stdout}`);
        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }
    } catch (error) {
        console.error(`error: ${error.message}`);
    }
}