const express = require('express');
const router = express.Router();

module.exports = function() {
    router.get("/", function (req, res) {
        res.render('imprint', { signedIn: !!req.user });
    });

    return router;
};