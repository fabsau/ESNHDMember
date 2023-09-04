const { google } = require("googleapis");
const gmail = google.gmail("v1");
const { v1: uuidv1 } = require("uuid");
const fs = require("fs");
const path = require("path");
const pug = require("pug");

module.exports = function (jwtClient) {
  const sendEmail = async (
    subject,
    templateName,
    templateData,
    to,
    cc = "",
    bcc = "",
    replyTo = process.env.REPLY_TO_EMAIL,
    attempts = 3,
    attachments = [],
  ) => {
    const messageId = `<${uuidv1()}.${Date.now()}@${
      process.env.GOOGLE_ADMIN_DOMAIN
    }>`;

    // Load and compile the pug template.
    const compileTemplate = pug.compileFile(
      path.join(__dirname, "..", "views", "email", `${templateName}.pug`),
    );

    // Generate the email body using the template and the provided data.
    const body = compileTemplate(templateData);

    const raw = makeBody(
      to,
      cc,
      bcc,
      replyTo,
      process.env.GOOGLE_ADMIN_USER,
      subject,
      body,
      messageId,
      attachments,
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
        await sendEmail(
          subject,
          templateName,
          templateData,
          to,
          cc,
          bcc,
          replyTo,
          attempts - 1,
        );
      } else {
        console.log(
          `Sending failure notification to ${process.env.GOOGLE_ADMIN_USER}`,
        );
        await sendEmail(
          "Email delivery failure",
          "emailDeliveryFailure", // Assuming this is the name of a template
          { errorMsg: `Failed to send email to ${to}.` }, // Pass whatever data the template needs
          process.env.GOOGLE_ADMIN_USER,
        );
      }
    }
  };

  function loadEmailTemplate(eventType) {
    const filePath = path.join(__dirname, "..", "email", `${eventType}.html`);
    return fs.readFileSync(filePath, "utf8");
  }

  function makeBody(
    to,
    cc,
    bcc,
    replyTo,
    from,
    subject,
    body,
    messageId,
    attachments,
  ) {
    let str = [
      'Content-Type: multipart/mixed; boundary="foo_bar_baz"',
      "MIME-Version: 1.0",
      `To: <${to}>`,
      `From: <${from}>`,
      `Subject: ${subject}`,
      `Message-ID: ${messageId}`,
      "X-Mailer: ESN Heidelberg Member Portal",
      "",
      "--foo_bar_baz",
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: quoted-printable",
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

    attachments.forEach((attachment) => {
      let content = fs.readFileSync(attachment.path, { encoding: "base64" });
      str = str.concat([
        "",
        "--foo_bar_baz",
        `Content-Type: ${attachment.mimetype}`,
        "Content-Transfer-Encoding: base64",
        "Content-Disposition: attachment",
        "",
        content,
      ]);
    });

    str = str.concat(["", "--foo_bar_baz--"]);

    return str.join("\n");
  }

  return {
    sendEmail,
  };
};
