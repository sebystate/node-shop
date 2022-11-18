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

// extract the user from the session
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((fetchedUser) => {
      req.user = fetchedUser;
      next();
    })
    .catch((err) => console.log(err));
});

// authentication and csrfToken middleware
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/admin', adminRoutes);
app.use(authRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose
  .connect(config.MONGODB_URI)
  .then((result) => {
    app.listen(config.server.port);
    console.log('Connected!');
    console.log(config.url);
  })
  .catch((err) => console.log(err));
