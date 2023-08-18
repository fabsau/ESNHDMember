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

    app.use((req, res, next) => {
        const sessionOptions = {
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                secure: false
            }
        };

        if (req.secure) {
            sessionOptions.cookie.secure = true;
        }

        session(sessionOptions)(req, res, next);
    });


    app.use(passport.initialize());
    app.use(passport.session());
};
