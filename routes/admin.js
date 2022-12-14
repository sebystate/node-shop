const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

router.get('/products', isAuth, adminController.getProducts);

router.get('/add-product', isAuth, adminController.getAddProduct);
router.post(
  '/add-product',
  isAuth,
  [
    body(
      'title',
      'Please enter a valid title for the product (min 3 characters).'
    )
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body('price')
      .isFloat()
      .custom((value, { req }) => {
        if (value <= 0) {
          throw new Error('Invalid price field');
        }
        return true;
      }),
    body('image').custom((value, { req }) => {
      if (!req.file) {
        throw new Error(
          'Please attach a file image with one of the following extensions [.jpg, .jpeg, .png]'
        );
      }
      return true;
    }),
    body(
      'description',
      'Please enter a valid description for the product (min 5 characters).'
    )
      .isLength({ min: 5, max: 400 })
      .trim(),
  ],
  adminController.postAddProduct
);

router.get('/edit-product/:id', isAuth, adminController.getEditProduct);
router.post(
  '/edit-product',
  isAuth,
  [
    body(
      'title',
      'Please enter a valid title for the product (min 3 characters).'
    )
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body('image').custom((value, { req }) => {
      if (!req.file) {
        throw new Error(
          'Please attach a file image with one of the following extensions [.jpg, .jpeg, .png]'
        );
      }
      return true;
    }),
    body('price')
      .isFloat()
      .custom((value, { req }) => {
        if (value <= 0) {
          throw new Error('Invalid price field');
        }
        return true;
      }),
    body(
      'description',
      'Please enter a valid description for the product (min 5 characters).'
    )
      .isLength({ min: 5, max: 400 })
      .trim(),
  ],
  adminController.postEditProduct
);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
