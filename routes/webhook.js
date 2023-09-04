const express = require("express");
const router = express.Router();
const { jwtClient } = require("../config/passport");
const mail = require("../config/mail")(jwtClient);
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const pug = require("pug");

module.exports = function (stripe) {
  router.use(bodyParser.raw({ type: "application/json" }));

  // Send a test email when the application starts
  mail.sendEmail(
    "Test email",
    "<p>This is a test email sent on application startup.</p>",
    "fabio@esn-heidelberg.de",
  );

  router.post("/webhook", (request, response) => {
    const event = request.body;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Get customer ID from session
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      // Retrieve customer from Stripe
      stripe.customers
        .retrieve(customerId)
        .then((customer) => {
          const customerEmail = customer.email;

          // Get additional details from the session
          const amountTotal = session.amount_total;
          const currency = session.currency;
          const paymentStatus = session.payment_status;

          // Get invoice from Stripe
          stripe.invoices
            .retrieve(session.invoice)
            .then((invoice) => {
              const invoicePdfUrl = invoice.invoice_pdf;
              const invoicePdfPath = path.join(__dirname, "invoice.pdf");

              // Fetch the PDF and save it to a local file
              fetch(invoicePdfUrl)
                .then((res) => res.buffer())
                .then((buffer) => {
                  fs.writeFile(invoicePdfPath, buffer, () => {
                    // Retrieve subscription from Stripe
                    stripe.subscriptions
                      .retrieve(subscriptionId)
                      .then((subscription) => {
                        // Create the email content
                        const data = {
                          customer: customer,
                          subscription: subscription,
                          invoice: invoice,
                          amountTotal: amountTotal,
                          currency: currency,
                          paymentStatus: paymentStatus,
                        };

                        const emailContent = pug.renderFile(
                          "../email/invoice.pug",
                          data,
                        );
                        // Attach the PDF to the email
                        mail
                          .sendEmail(
                            "Your Invoice",
                            emailContent,
                            customerEmail,
                            null,
                            null,
                            null,
                            null,
                            [
                              {
                                path: invoicePdfPath,
                                mimetype: "application/pdf",
                              },
                            ],
                          )
                          .then(() => {
                            // Delete the PDF file after sending the email
                            fs.unlink(invoicePdfPath, (err) => {
                              if (err) {
                                console.error(
                                  `Error deleting file ${invoicePdfPath}: `,
                                  err,
                                );
                              }
                            });
                          })
                          .catch((err) => {
                            console.log("Error sending email: ", err);
                          });
                      })
                      .catch((err) => {
                        console.log("Error retrieving subscription: ", err);
                      });
                  });
                })
                .catch((err) => {
                  console.log("Error downloading invoice PDF: ", err);
                });
            })
            .catch((err) => {
              console.log("Error retrieving invoice: ", err);
            });
        })
        .catch((err) => {
          console.log("Error retrieving customer: ", err);
        });
    }

    // Return a response to Stripe
    response.json({ received: true });
  });

  return router;
};
