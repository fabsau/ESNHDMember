const { google } = require("googleapis");
const admin = google.admin("directory_v1");

exports.fetchUsers = async function (pageToken) {
  try {
    return await admin.users.list({
      domain: process.env.GOOGLE_ADMIN_DOMAIN,
      maxResults: 100,
      pageToken: pageToken,
      projection: "full",
    });
  } catch (error) {
    if (process.env.DEBUG_MODE === "TRUE") {
      console.error(`Error fetching user list: ${error}`);
    }
    return null;
  }
};

exports.fetchUserSecondaryEmailByEmail = async function (email) {
  try {
    const user = await admin.users.get({
      userKey: email,
    });

    const secondaryEmail = user.data.emails.find(
      (email) =>
        email.type === "home" ||
        email.type === "work" ||
        email.type === "custom" ||
        email.type === "other",
    );
    return secondaryEmail ? secondaryEmail.address : null;
  } catch (error) {
    if (process.env.DEBUG_MODE === "TRUE") {
      console.error(`Error fetching user's secondary email by email: ${error}`);
    }
    return null;
  }
};

exports.fetchUserNamesByEmail = async function (email) {
  try {
    const user = await admin.users.get({
      userKey: email,
    });

    return {
      firstName: user.data.name.givenName,
      lastName: user.data.name.familyName,
    };
  } catch (error) {
    if (process.env.DEBUG_MODE === "TRUE") {
      console.error(`Error fetching user's names by email: ${error}`);
    }
    return null;
  }
};
