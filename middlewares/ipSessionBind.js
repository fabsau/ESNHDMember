module.exports = function ipSessionBind(req, res, next) {
  if (req.session) {
    if (!req.session.ipAddress) {
      req.session.ipAddress = req.ip;
    } else if (req.session.ipAddress !== req.ip) {
      req.session.destroy((err) => {
        if (err) {
          console.log(err);
        }
        res.redirect("/");
        return;
      });
    }
  }
  next();
};
