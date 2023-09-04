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

  // Test email sent on application startup
  mail.sendEmail(
    "Test email",
    "<p>This is a test email sent on application startup.</p>",
    "fabio@esn-heidelberg.de",
    [],
  );

  router.post("/webhook", (request, response) => {
    console.log("Webhook received");
    const event = request.body;

    // Function to fetch PDF with retry mechanism
    const fetchPdf = (url, path, retries = 3) => {
      fetch(url)
        .then((res) => res.buffer())
        .then((buffer) => {
          fs.writeFile(path, buffer, () => {
            console.log("PDF downloaded and saved");

            // After saving the PDF, send the email
            stripe.subscriptions
              .retrieve(subscriptionId)
              .then((subscription) => {
                console.log("Subscription retrieved");
                const planName = subscription.plan.nickname;
                console.log(`planName: ${planName}`);

                // Create email content
                const emailContent = pug.renderFile("../email/invoice.pug", {
                  name: customerName,
                  amount: formatCurrency(amountTotal, currency),
                  planName: planName,
                  invoiceId: invoiceId,
                });

                // Create email
                const email = {
                  to: customerEmail,
                  from: process.env.GOOGLE_ADMIN_USER,
                  subject: `Your invoice for ${planName}`,
                  html: emailContent,
                  attachments: [
                    {
                      filename: "invoice.pdf",
                      path: invoicePdfPath,
                      contentType: "application/pdf",
                    },
                  ],
                };

                // Send email
                mail
                  .sendEmail(email)
                  .then(() => {
                    console.log("Email sent");

                    // After sending the email, delete the PDF
                    fs.unlink(invoicePdfPath, (err) => {
                      if (err) {
                        console.error("Error deleting invoice PDF: ", err);
                      } else {
                        console.log("Invoice PDF deleted");
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
          if (retries > 0) {
            console.log(
              `Error downloading invoice PDF, retrying... ${retries} attempts left.`,
            );
            setTimeout(() => fetchPdf(url, path, retries - 1), 60000); // retry after 60 seconds
          } else {
            console.log("Error downloading invoice PDF: ", err);
          }
        });
    };

    if (event.type === "checkout.session.completed") {
      console.log("Handling checkout.session.completed event");
      const session = event.data.object;

      // Get customer ID from session
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      console.log(
        `customerId: ${customerId}, subscriptionId: ${subscriptionId}`,
      );

      // Retrieve customer from Stripe
      stripe.customers
        .retrieve(customerId)
        .then((customer) => {
          console.log("Customer retrieved");
          const customerEmail = customer.email;
          const customerName = customer.name;
          console.log(
            `customerEmail: ${customerEmail}, customerName: ${customerName}`,
          );

          // Get additional details from the session
          const amountTotal = session.amount_total;
          const currency = session.currency;
          const paymentStatus = session.payment_status;
          console.log(
            `amountTotal: ${amountTotal}, currency: ${currency}, paymentStatus: ${paymentStatus}`,
          );

          // Get invoice from Stripe
          stripe.invoices
            .retrieve(session.invoice)
            .then((invoice) => {
              console.log("Invoice retrieved");
              const invoicePdfUrl = invoice.invoice_pdf;
              const invoiceId = invoice.number;
              const invoicePdfPath = path.join(__dirname, "invoice.pdf");
              console.log(
                `invoicePdfUrl: ${invoicePdfUrl}, invoicePdfPath: ${invoicePdfPath}`,
              );

              // Fetch the PDF and save it to a local file
              fetchPdf(invoicePdfUrl, invoicePdfPath);
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
