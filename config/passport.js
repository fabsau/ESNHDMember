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

    app.use(session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.ENABLE_HTTPS === 'TRUE'
        }
    }));

    app.use(passport.initialize());
    app.use(passport.session());
};
