const { google } = require('googleapis');
const os = require('os');

module.exports = jwtClient => {
    const gmail = google.gmail({ version: 'v1', auth: jwtClient });

    const sendEmail = async (subject, body, to, cc = null, bcc = null, retryCount = 0) => {
        // The Gmail API requires emails to be base64url encoded
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

        // Generate a unique Message-ID
        const messageId = `<${Date.now()}${Math.random()}@${os.hostname()}>`;

        const messageParts = [
            `From: <${jwtClient.email}>`,
            `To: <${to}>`,
            cc ? `Cc: <${cc}>` : '',
            bcc ? `Bcc: <${bcc}>` : '',
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `Subject: ${utf8Subject}`,
            `Date: ${new Date().toUTCString()}`,
            `Message-ID: ${messageId}`,
            `Reply-To: <${process.env.REPLY_TO_EMAIL}>`,
            `User-Agent: ESNHDMail (Node.js/${process.version})`,
            '',
            body,
        ].filter(Boolean); // filter out any empty strings
        const message = messageParts.join('\n');

        // The body needs to be base64url encoded
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        try {
            let res = await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedMessage,
                },
            });

            console.log(res.data);
        } catch (error) {
            console.error(`Failed to send email: ${error}`);
            if (retryCount < 3) {
                console.log(`Retrying... (${retryCount + 1})`);
                await sendEmail(subject, body, to, cc, bcc, retryCount + 1);
            } else {
                console.error('Failed to send email after 3 attempts, sending failure report');
                await sendEmail('Email delivery failed', `Failed to send email to ${to} after 3 attempts.\n\nError: ${error}`, jwtClient.email);
            }
        }
    };

    return { sendEmail };
};
