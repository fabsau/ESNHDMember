const fs = require("fs");
const selfsigned = require("selfsigned");

module.exports = {
  getSslOptions: () => {
    let sslOptions;
    if (process.env.CERT_METHOD === "SELFSIGN") {
      sslOptions = module.exports.generateCertificates(); // Updated this line
    } else if (process.env.CERT_METHOD === "CUSTOM") {
      try {
        sslOptions = {
          key: fs.readFileSync(
            process.env.CUSTOM_CERT_KEY_FILE_PATH || "./cert/custom/key.pem",
          ),
          cert: fs.readFileSync(
            process.env.CUSTOM_CERT_FILE_PATH || "./cert/custom/cert.pem",
          ),
          port: normalizePort(process.env.PORT || "3000"),
        };
      } catch (error) {
        if (process.env.DEBUG_MODE === "TRUE") {
          console.error("Unable to read HTTPS credentials:", error.message);
        }
        return;
      }
    }
    return sslOptions;
  },

  generateCertificates: () => {
    const certDir = "./cert/selfsigned";
    const keyPath = `${certDir}/key.pem`;
    const certPath = `${certDir}/cert.pem`;

    const validityDays = process.env.SELFSIGNED_VALIDITY_DAYS || 365;
    const commonName = process.env.CERT_DOMAIN || "localhost";

    const attrs = [{ name: "commonName", value: commonName }];

    // Create the directory if it doesn't exist
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }

    if (!fs.existsSync(certPath)) {
      if (process.env.DEBUG_MODE === "TRUE") {
        console.log("Certificate not found, generating a new one...");
      }
      const pems = selfsigned.generate(attrs, { days: Number(validityDays) });

      fs.writeFileSync(keyPath, pems.private);
      fs.writeFileSync(certPath, pems.cert);
      if (process.env.DEBUG_MODE === "TRUE") {
        console.log("SSL certificate generated...");
      }
    } else {
      if (process.env.DEBUG_MODE === "TRUE") {
        console.log("SSL certificate found");
      }
    }

    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  },
};
