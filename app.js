const path = require('path');

const express = require('express');

const bodyParser = require('body-parser');

const mongoose = require('mongoose');

const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const MONGODB_URI =
  'mongodburi';

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions',
});

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

// hardwiring a login middleware for a user already in the database
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

app.use('/admin', adminRoutes);
app.use(authRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    // findOne() give back the first user that finds
    User.findOne().then((user) => {
      if (!user) {
        // Create a dummy user
        const user = new User({
          username: 'sebystate',
          email: 'sebystate@nodeShop.com',
          cart: {
            items: [],
          },
        });
        user.save();
      }
    });
    app.listen(3000);
    console.log('Connected!');
    console.log('http://localhost:3000');
  })
  .catch((err) => console.log(err));
