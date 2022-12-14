exports.get404 = (req, res, next) => {
  res
    .status(404)
    .render('404', {
      docTitle: '404: Page Not Found!',
      navPath: '/404',
      isAuthenticated: req.session.isLoggedIn
    });
};

exports.get500 = (req, res, next) => {
  res
    .status(500)
    .render('500', {
      docTitle: '500: Server Error!',
      navPath: '/500',
      isAuthenticated: req.session.isLoggedIn
    });
};
