exports.defaultHandler = (req, res) => {
  req.user ? res.redirect("/home") : res.render("login");
};

exports.callbackHandler = (req, res) => {
  res.redirect("/home");
};

exports.loginHandler = (passport) => {
  return passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  });
};
