exports.defaultHandler = (req, res) => {
  res.render("privacy", { signedIn: !!req.user });
};
