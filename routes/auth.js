// require express and router
const express = require('express');
const router = express.Router();

// export router function
module.exports = function(passport) {
    // get route
    router.get("/", (req, res) => {
        // if user is logged in, redirect to home
        // else, render login
        req.user ? res.redirect("/home") : res.render("login");
    });

    // get route for login
    router.get("/login", passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account"
    }));

    // get route for callback
    router.get("/auth/google/callback", passport.authenticate("google", {
        failureRedirect: "/login"
    }), function(req, res) {
        res.redirect("/home");
    });

    // return router
    return router;
};