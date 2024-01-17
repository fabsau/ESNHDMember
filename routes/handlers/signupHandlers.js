const validator = require("validator");

exports.defaultHandler = (req, res) => {
  res.render("signup", { signedIn: !!req.user });
};

exports.signupHandler = (req, res) => {
  let {firstName, lastName, email, mobile, agreesToPrivacy} = req.body;

  // Remove the umlauts and replace with corresponding strings
  firstName = firstName.replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
  lastName = lastName.replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");

  if(!validator.isEmpty(firstName) && !validator.isEmpty(lastName) &&
  validator.isEmail(email) && validator.isMobilePhone(mobile, 'any', {strictMode: true}) &&
  agreesToPrivacy) {

    // Do signup operation
    // ...

    res.render("signup", { success: true });
  }
  else {
    res.render("signup", { success: false, errorMessage: 'Invalid data provided' });
  }
};
