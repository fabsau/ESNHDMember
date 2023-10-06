const { google } = require("googleapis");
const admin = google.admin("directory_v1");

module.exports = function (passport, GoogleStrategy, app, session) {
  const jwtClient = new google.auth.JWT(
    process.env.GOOGLE_ADMIN_CLIENT_EMAIL,
    null,
    process.env.GOOGLE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    [
      "https://www.googleapis.com/auth/admin.directory.user.readonly",
      "https://www.googleapis.com/auth/gmail.send",
    ],
    process.env.GOOGLE_ADMIN_USER,
  );

  google.options({ auth: jwtClient });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
      },
      async function (accessToken, refreshToken, profile, done) {
        let {
          given_name: firstName,
          family_name: lastName,
          email,
        } = profile._json;

        // Fetch user's organizational unit
        let userDirectory;
        try {
          userDirectory = await admin.users.get({
            userKey: email,
          });
        } catch (err) {
          console.log("Error fetching user directory details: ", err);
          return done(err);
        }

        let user = {
          id: profile.id,
          displayName: profile.displayName,
          givenName: firstName,
          familyName: lastName,
          email: email,
          ou: userDirectory.data.orgUnitPath,
        };
        return done(null, user);
      },
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  const sessionOptions = {
    name: process.env.ENABLE_HTTPS === "TRUE" ? "__Host-Session" : "Session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // The cookie is only accessible by the web server
      maxAge: 24 * 60 * 60 * 1000, // Cookies will expire in 24 hours
      sameSite: "lax", // Protection against CSRF attacks
    },
  };

  app.use(session(sessionOptions));

  app.use((req, res, next) => {
    sessionOptions.cookie.secure = !!req.secure;
    next();
  });

  app.use(passport.initialize());
  app.use(passport.session());
  module.exports.jwtClient = jwtClient;
};
