const greenlockExpress = require("greenlock-express");
const { exec } = require("child_process");
const path = require("path");
const parentDir = path.dirname(__dirname);

module.exports = {
  init: (app) => {
    let subject = process.env.CERT_DOMAIN;
    let altnames = process.env.CERT_ALTNAMES;
    let cmd = `npx greenlock add --subject ${subject} --altnames ${altnames}`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        if (process.env.DEBUG_MODE === "TRUE") {
          console.error(`error: ${error.message}`);
        }
        return;
      }
      if (stderr) {
        if (process.env.DEBUG_MODE === "TRUE") {
          console.error(`stderr: ${stderr}`);
        }
        return;
      }
      if (process.env.DEBUG_MODE === "TRUE") {
        console.log(`stdout: ${stdout}`);
      }
    });
    greenlockExpress
      .init({
        packageRoot: parentDir,
        configDir: process.env.CONFIG_DIR || "./cert/greenlock",
        maintainerEmail: process.env.LETSENCRYPT_EMAIL,
        cluster: false,
      })
      .serve(app);
    if (process.env.DEBUG_MODE === "TRUE") {
      console.log("Greenlock's server started");
    }
  },
};
