module.exports = function(passport, GoogleStrategy, app, session) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback'
    }, function(accessToken, refreshToken, profile, done) {
        let { given_name: firstName, family_name: lastName, email } = profile._json;
        let user = {
            id: profile.id,
            displayName: profile.displayName,
            givenName: firstName,
            familyName: lastName,
            email: email
        };
        return done(null, user);
    }));

    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user, done) => {
        done(null, user);
    });

    const sessionOptions = {
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true, // The cookie is only accessible by the web server
            maxAge: 24 * 60 * 60 * 1000, // Cookies will expire in 24 hours
            sameSite: 'lax', // Protection against CSRF attacks
        }
    }

    app.use(session(sessionOptions));

    app.use((req, res, next) => {
        if (req.secure) {
            sessionOptions.cookie.secure = true; // served over HTTPS
        } else {
            sessionOptions.cookie.secure = false; // served over HTTP
        }
        next();
    });

    app.use(passport.initialize());
    app.use(passport.session());
};
