module.exports = function () {
  const allowedHosts = process.env.ALLOWED_HOSTS.split(",");

  return function (req, res, next) {
    if (!allowedHosts.includes(req.headers.host.toLowerCase())) {
      return res.status(400).send("Invalid host");
    }
    next();
  };
};
