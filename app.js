const path = require('path');
const fs = require('fs');
// const https = require('https');

const express = require('express');

const bodyParser = require('body-parser');
const multer = require('multer');

const helmet = require('helmet');

const compression = require('compression');

const morgan = require('morgan');

const mongoose = require('mongoose');

const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const csrf = require('csurf');

//SSL Server key and certificate
// const privateKey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');

const flash = require('connect-flash');

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.zzijgaq.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

const store = new MongoDBStore({
  uri: MONGODB_URI,
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

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
  //IMPORTANT: 'image' is the name of the form field for the file picker
);
app.use(bodyParser.urlencoded({ extended: false }));

// Serve files (.css, .js, images) statically
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

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

//app.get('/500', errorController.get500);

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
app.use((err, req, res, next) => {
  // you could render a page with the status code based on the error
  // this obviously implies that you have set the error.httpStatusCode
  // res.status(error.httpStatusCode).render(...)

  // or just simply render the page
  const status = err.status || 500;
  res.status(status).render('500', {
    docTitle: '500: Server Error!!!!',
    navPath: '/500',
    isAuthenticated: req.session.isLoggedIn,
  });
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    const port = process.env.PORT || 3000;
    // https
    //   .createServer({ key: privateKey, cert: certificate }, app)
    //   .listen(port);

    app.listen(port)
    console.log('Connected!');
  })
  .catch((err) => console.log(err));
