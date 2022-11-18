const express = require('express');
const { check, body } = require('express-validator');
const authController = require('../controllers/auth');

const router = express.Router();

const User = require('../models/user');

router.get('/login', authController.getLogin);
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      // email sanitization
      .normalizeEmail(),
    body(
      'password',
      'Please enter a password with only numbers and text that is at least 5 characters long'
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      // password sanitiziation (trim extra white spaces at beginning or at the end)
      .trim(),
  ],
  authController.postLogin
);

router.get('/signup', authController.getSignup);
router.post(
  '/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .custom((value, { req }) => {
        // return a Promise if the email is already signed up
        // this is an asychcronous validation, because we reach the database
        return User.findOne({ email: value }).then((userData) => {
          if (userData) {
            return Promise.reject(
              'Inserted email is already signed up: please pick a different one.'
            );
          }
        });
      })
      .normalizeEmail(),
    body(
      'password',
      // if the error is the same for all checks then you add it here
      'Please enter a password with only numbers and text that is at least 5 characters long'
      // otherwise you can use withMessage() like above
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    body('confirmPassword')
      .trim()
      // we implicity chech for length at least 5 and alphanumeric implicitly
      // because we are checking for equality with 'password'
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords fields do not match!');
        }
        return true;
      }),
  ],
  authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);

module.exports = router;
