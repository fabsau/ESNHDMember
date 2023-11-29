exports.logoutPostHandler = function (req, res) {
  req.logout(function (err) {
    if (err) {
      if (process.env.DEBUG_MODE === "TRUE") {
        console.log(err);
      }
    }
    req.session.destroy(function (err) {
      if (err) {
        if (process.env.DEBUG_MODE === "TRUE") {
          console.log(err);
        }
      }
      res.redirect("/");
    });
  });
};
