const User = require("../models/user");

module.exports.renderSignupForm = (req, res) => {
  if (req.query.redirect) {
    req.session.redirectUrl = req.query.redirect;
  }
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registerdUser = await User.register(newUser, password);
    console.log(registerdUser);
    req.login(registerdUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to RoamHaven");
      let redirectUrl = req.session.redirectUrl || "/listings";
      delete req.session.redirectUrl;
      req.session.save((err) => {
        if (err) return next(err);
        res.redirect(redirectUrl);
      });
    });
  } catch (e) {
    req.flash("error", e.message);
    req.session.save(() => {
      res.redirect("/signup");
    });
  }
};

module.exports.renderLoginForm = (req, res) => {
  if (req.query.redirect) {
    req.session.redirectUrl = req.query.redirect;
  }
  res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
  req.flash("success", "Welcome back to RoamHaven!");
  let redirectUrl = res.locals.redirectUrl || "/listings";
  delete req.session.redirectUrl;
  req.session.save(() => {
    res.redirect(redirectUrl);
  });
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You are logged out!");
    req.session.save(() => {
      res.redirect("/listings");
    });
  });
};

module.exports.wishlist = async (req, res) => {
  const { ids } = req.query;
  if (!ids) {
    // Render wishlist page to load wishlist IDs from localStorage client-side
    return res.render("users/wishlist.ejs", { listings: null });
  }

  if (ids === "empty") {
    return res.render("users/wishlist.ejs", { listings: [] });
  }

  try {
    const idsArray = ids.split(",");
    const Listing = require("../models/listing");
    const listings = await Listing.find({ _id: { $in: idsArray } });
    res.render("users/wishlist.ejs", { listings });
  } catch (err) {
    req.flash("error", "Failed to load wishlist");
    res.redirect("/listings");
  }
};
