const { validationResult } = require('express-validator');
const { getUserMessage } = require('../util/user-message');

const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  const message = {
    message: getUserMessage(req.flash('error')),
    type: 'error',
  };
  res.render('admin/edit-product', {
    docTitle: 'Add Product',
    navPath: '/admin/add-product',
    editing: false,
    userMessage: message,
     product: {
        title: '',
        imageUrl: '',
        price: null,
        description: '',
      },
    validationErrors: [],
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    const message = {
      message: getUserMessage(req.flash('error')),
      type: 'error',
    };
    return res.status(422).render('admin/edit-product', {
      docTitle: 'Add Product',
      navPath: '/admin/add-product',
      editing: false,
      userMessage: message,
      product: {
        title: title,
        imageUrl: imageUrl,
        price: price,
        description: description,
      },
      validationErrors: errors.array(),
    });
  }
  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user,
  });

  product
    .save()
    .then((result) => {
      console.log('Created new product');
      res.redirect('/admin/products');
    })
    .catch((err) => console.log(err));
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const productId = req.params.id;

  Product.findById(productId)
    .then((product) => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        docTitle: 'Edit Product',
        navPath: '/admin/edit-product',
        editing: editMode,
        userMessage: null,
        product: product,
        validationErrors: [],
      });
    })
    .catch((err) => console.log(err));
};

exports.postEditProduct = (req, res, next) => {
  const productId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedImageUrl = req.body.imageUrl;
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    const message = {
      message: getUserMessage(req.flash('error')),
      type: 'error',
    };
    return res.status(422).render('admin/edit-product', {
      docTitle: 'Edit Product',
      navPath: '/admin/edit-product',
      editing: true,
      userMessage: message,
      product: {
        title: updatedTitle,
        imageUrl: updatedImageUrl,
        price: updatedPrice,
        description: updatedDescription,
        _id: productId
      },
      validationErrors: errors.array(),
    });
  }

  Product.findById(productId)
    .then((fetchedProduct) => {
      if (fetchedProduct.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }
      fetchedProduct.title = updatedTitle;
      fetchedProduct.price = updatedPrice;
      fetchedProduct.description = updatedDescription;
      fetchedProduct.imageUrl = updatedImageUrl;
      return fetchedProduct
        .save()
        .then((result) => {
          console.log('Product successfully updated!');
          res.redirect('/admin/products');
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then((products) => {
      res.render('admin/products', {
        docTitle: 'Admin Products',
        navPath: '/admin/products',
        products: products,
      });
    })
    .catch((err) => console.log(err));
};

exports.postDeleteProduct = (req, res, next) => {
  const productId = req.body.productId;
  Product.deleteOne({ _id: productId, userId: req.user._id })
    .then(() => {
      console.log('Product successfully deleted');
      res.redirect('/admin/products');
    })
    .catch((err) => console.log(err));
};
