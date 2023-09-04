const { google } = require("googleapis");
const gmail = google.gmail("v1");
const { v1: uuidv1 } = require("uuid");
const fs = require("fs");
const path = require("path");

module.exports = function (jwtClient) {
  const sendEmail = async (
    subject,
    body,
    to,
    cc = "",
    bcc = "",
    replyTo = process.env.REPLY_TO_EMAIL,
    attempts = 3,
  ) => {
    const messageId = `<${uuidv1()}.${Date.now()}@${
      process.env.GOOGLE_ADMIN_DOMAIN
    }>`;

    const raw = makeBody(
      to,
      cc,
      bcc,
      replyTo,
      process.env.GOOGLE_ADMIN_USER,
      subject,
      body,
      messageId,
    );
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
      console.log(`Email sent to ${to}`);
    } catch (err) {
      console.error(
        `Failed to send email to ${to}. Attempt: ${
          4 - attempts
        }. Error: ${err}`,
      );
      if (attempts > 1) {
        console.log(`Retrying to send email to ${to}`);
        await sendEmail(subject, body, to, cc, bcc, replyTo, attempts - 1);
      } else {
        console.log(
          `Sending failure notification to ${process.env.GOOGLE_ADMIN_USER}`,
        );
        await sendEmail(
          "Email delivery failure",
          `Failed to send email to ${to}.`,
          process.env.GOOGLE_ADMIN_USER,
        );
      }
    }
  };

  function loadEmailTemplate(eventType) {
    const filePath = path.join(__dirname, "..", "email", `${eventType}.html`);
    return fs.readFileSync(filePath, "utf8");
  }

  function makeBody(to, cc, bcc, replyTo, from, subject, body, messageId) {
    let str = [
      'Content-Type: text/html; charset="UTF-8"',
      "MIME-Version: 1.0",
      `To: <${to}>`,
      `From: <${from}>`,
      `Subject: ${subject}`,
      `Message-ID: ${messageId}`,
      "X-Mailer: ESN Heidelberg Member Portal",
      "",
      body,
    ];

    if (cc) {
      str.splice(3, 0, `Cc: <${cc}>`);
    }

    if (bcc) {
      str.splice(4, 0, `Bcc: <${bcc}>`);
    }

    if (replyTo) {
      str.splice(5, 0, `Reply-To: <${replyTo}>`);
    }

    return str.join("\n");
  }

  return {
    sendEmail,
  };
};
