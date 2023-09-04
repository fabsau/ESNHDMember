exports.defaultHandler = (req, res) => {
  res.render("imprint", { signedIn: !!req.user });
};
