const greenlockExpress = require('greenlock-express');
const { exec } = require("child_process");
const path = require('path');
const parentDir = path.dirname(__dirname);

module.exports = {
    init: (app) => {
        let subject = process.env.LETSENCRYPT_SUBJECT;
        let altnames = process.env.LETSENCRYPT_ALTNAMES;
        let cmd = `npx greenlock add --subject ${subject} --altnames ${altnames}`;
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
        });
        greenlockExpress.init({
            packageRoot: parentDir,
            configDir: process.env.CONFIG_DIR || "./cert/greenlock",
            maintainerEmail: process.env.LETSENCRYPT_EMAIL,
            cluster: false
        }).serve(app);
        console.log("Greenlock's server started");
    }
};
