const express = require('express');
const router = express.Router();

module.exports = function(passport) {
    router.get("/", (req, res) => {
        req.user ? res.redirect("/home") : res.render("login");
    });

    router.get("/login", passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account"
    }));

    router.get("/auth/google/callback", passport.authenticate("google", {
        failureRedirect: "/login"
    }), function(req, res) {
        res.redirect("/home");
    });

    return router;
};