module.exports = function ipSessionBind(req, res, next) {
  if (req.session) {
    if (!req.session.ipAddress) {
      req.session.ipAddress = req.ip;
      next();  // Proceed only if the IP address was not set
    } else if (req.session.ipAddress !== req.ip) {
      req.session.destroy((err) => {
        if (err) {
          console.log(err);
        }
        res.redirect("/");
      });
    } else {
      next();
    }
  } else {
    next();
  }
};