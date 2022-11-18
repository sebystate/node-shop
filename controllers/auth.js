const crypto = require('crypto');

const bcryptjs = require('bcryptjs');

const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const User = require('../models/user');

const { getUserMessage } = require('../util/user-message');

var env = process.env.NODE_ENV || 'development';
const config = require('../config')[env];

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: config.mail_server.API_KEY,
    },
  })
);

exports.getLogin = (req, res, next) => {
  const message = {
    message: getUserMessage(req.flash('error')),
    type: 'error',
  };
  res.render('auth/login', {
    docTitle: 'Login',
    navPath: '/login',
    userMessage: message,
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then((fetchedUser) => {
      if (!fetchedUser) {
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/login');
      }
      bcryptjs
        .compare(password, fetchedUser.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.user = fetchedUser;
            req.session.isLoggedIn = true;
            return req.session.save((err) => {
              if (err) {
                console.log(err);
              }
              res.redirect('/');
            });
          }
          req.flash('error', 'Invalid email or password.');
          res.redirect('/login');
        })
        .catch((err) => {
          console.log(err);
          res.redirect('/login');
        });
    })
    .catch((err) => console.log(err));
};

exports.getSignup = (req, res, next) => {
  const message = {
    message: getUserMessage(req.flash('error')),
    type: 'error',
  };
  res.render('auth/signup', {
    docTitle: 'Signup',
    navPath: '/signup',
    userMessage: message,
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  User.findOne({ email: email })
    .then((userData) => {
      if (userData) {
        req.flash('error', 'Email ' + email + ' already signed up.');
        res.redirect('/signup');
        return;
      }
      return bcryptjs
        .hash(password, 12)
        .then((hashedPassword) => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] },
          });
          return user.save();
        })
        .then((result) => {
          res.redirect('/login');
          return transporter.sendMail({
            to: email,
            from: config.mail_server.from_address,
            subject: 'Signup succeeded!',
            html: '<h1>You successfully signed up!</h1>',
          });
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  const message = {
    message: getUserMessage(req.flash('error')),
    type: 'error',
  };
  res.render('auth/reset', {
    docTitle: 'Reset Password',
    navPath: '/reset',
    userMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash('error', 'No account with that email found.');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600 * 1000; // in ms
        user.save();
        return;
      })
      .then((result) => {
        res.redirect('/');
        transporter.sendMail({
          to: req.body.email,
          from: config.mail_server.from_address,
          subject: 'Password reset!',
          html: `
          <p>You requested a password reset</p>
          <p>Click this <a href="${config.url}/reset/${token}">link</a> to set a new password</p>
          `,
        });
      })
      .catch((err) => console.log(err));
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  // find the user which reset token is the same in the req.params and it hasn't expired yet
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      const message = {
        message: getUserMessage(req.flash('error')),
        type: 'error',
      };
      res.render('auth/new-password', {
        docTitle: 'New Password',
        navPath: '/new-password',
        userMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => console.log(err));
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;
  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcryptjs.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login')
    })
    .catch((err) => console.log(err));
};
