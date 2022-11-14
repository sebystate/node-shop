const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const errorController = require('./controllers/error');

const User = require('./models/user');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// hardwiring a login middleware for a user already in the database
app.use((req, res, next) => {
  // id of a registered user, in our case it's the dummy one created below
  User.findById('63721aff9e5fc9056298f501')
    .then((fetchedUser) => {
      req.user = fetchedUser;
      next();
    })
    .catch((err) => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose
  .connect(
    'mongodbAtlasString'
  )
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
    console.log('Connected');
  })
  .catch((err) => console.log(err));
