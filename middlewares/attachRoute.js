module.exports = function(req, res, next) {
    res.locals.route = req.path;
    next();
}