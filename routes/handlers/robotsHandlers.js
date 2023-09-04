module.exports = function (req, res) {
  res.type("text/plain");
  res.send("User-agent: *\nDisallow: /");
};
