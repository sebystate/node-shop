const { validationResult } = require('express-validator');
const { getUserMessage } = require('../util/user-message');

const fileUtils = require('../util/file');

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
  const image = req.file;
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
        price: price,
        description: description,
      },
      validationErrors: errors.array(),
    });
  }

  const imageUrl = image.path;

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
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
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
        // IMPORTANT: _id is baked in 'product' so it can be accessed in the view
        product: product,
        validationErrors: [],
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const productId = req.body.productId;
  const updatedTitle = req.body.title;
  const imageFile = req.file;
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
        price: updatedPrice,
        description: updatedDescription,
        // IMPORTANT: you need to pass back the _id otherwise you won't be able to access it in the view upon failing validation
        _id: productId,
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
      if (imageFile) {
        fileUtils.deleteFile(fetchedProduct.imageUrl);
        fetchedProduct.imageUrl = imageFile.path;
      }
      return fetchedProduct.save().then((result) => {
        console.log('Product successfully updated!');
        res.redirect('/admin/products');
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
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
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const productId = req.body.productId;
  Product.findById(productId)
    .then((fetchedProduct) => {
      if (!fetchedProduct) {
        return next(new Error('Product not found'));
      }
      fileUtils.deleteFile(fetchedProduct.imageUrl);
      return Product.deleteOne({ _id: productId, userId: req.user._id });
    })
    .then(() => {
      console.log('Product successfully deleted');
      res.redirect('/admin/products');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
