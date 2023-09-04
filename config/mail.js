// mail.js
const { google } = require("googleapis");
const gmail = google.gmail("v1");

module.exports = function (jwtClient) {
  return {
    async sendEmail(subject, body, to) {
      const raw = makeBody(to, process.env.GOOGLE_ADMIN_USER, subject, body);
      const encodedMessage = Buffer.from(raw)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      try {
        await gmail.users.messages.send({
          auth: jwtClient,
          userId: "me",
          requestBody: {
            raw: encodedMessage,
          },
        });
        console.log("Email sent");
      } catch (err) {
        console.log(`Error sending email: ${err}`);
      }
    },
  };

  function makeBody(to, from, subject, body) {
    const str = [
      `To: <${to}>`,
      `From: <${from}>`,
      `Subject: ${subject}`,
      "",
      body,
    ].join("\n");
    return str;
  }
};
