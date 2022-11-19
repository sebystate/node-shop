const path = require('path');

const express = require('express');

const bodyParser = require('body-parser');

const mongoose = require('mongoose');

const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const csrf = require('csurf');

const flash = require('connect-flash');

var env = process.env.NODE_ENV || 'development';
const config = require('./config')[env];

const store = new MongoDBStore({
  uri: config.MONGODB_URI,
  collection: 'sessions',
});

const csrfProtection = csrf();

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const User = require('./models/user');

const errorController = require('./controllers/error');

const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'this_should_be_longer',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(csrfProtection);

app.use(flash());

// authentication and csrfToken middleware
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

// extract the user from the session
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
  .then((fetchedUser) => {
      if (!fetchedUser) {
        return next();
      }
      req.user = fetchedUser;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

app.use('/admin', adminRoutes);
app.use(authRoutes);
app.use(shopRoutes);

app.get('/500', errorController.get500);

// we chose to handle the 404 erro case as a 'normal' middleware because it's
// just a valid url that we know that doesn't exist in the server
// basically, it doesn't create a tecnical error object
app.use(errorController.get404);

/** Error handling middleware **/
// Even though the 404 middleware is the last 'normal' middleware
// that catches any next() calls that are unhandled by the prior middlewares,
// Express has a special middleware with 4 arguments that is used to handle errors
// This means that when we call next(new Error(..)), all the other 'normal'
// middlewares get skipped, and the error will be handled here.
// IMPORTANT: if we have multiple error-handling middlewares,
// they will be executed top to bottom (just like the 'normal' middlewares)
app.use((error, req, res, next) => {
  // you could render a page with the status code based on the error
  // this obviously implies that you have set the error.httpStatusCode
  // res.status(error.httpStatusCode).render(...)

  // or just simply render the page
  res
    .status(500)
    .render('500', {
      docTitle: '500: Server Error!',
      navPath: '/500',
      isAuthenticated: req.session.isLoggedIn
    });
});

mongoose
  .connect(config.MONGODB_URI)
  .then((result) => {
    app.listen(config.server.port);
    console.log('Connected!');
    console.log(config.url);
  })
  .catch((err) => console.log(err));
