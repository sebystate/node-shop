const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  isLoggedIn = false;
  res.render('auth/login', {
    docTitle: 'Login',
    navPath: '/login',
    isAuthenticated: req.session.isLoggedIn,
  });
};

exports.postLogin = (req, res, next) => {
  // id of a registered user, in our case it's the dummy one created below
  User.findById('63721aff9e5fc9056298f501')
    .then((fetchedUser) => {
      req.session.user = fetchedUser;
      req.session.isLoggedIn = true;
      req.session.save((err) => {
        console.log(err);
        res.redirect('/');
      });
    })
    .catch((err) => console.log(err));
};
exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect('/');
  });
};

function getCookie(cookies, cookieName) {
  const parts = cookies.split(`; ${cookieName}=`)[0].trim().split('=');
  if (parts.length === 2) return parts.pop();
}
