const product = require('../models/product');
const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    docTitle: 'Add Product',
    navPath: '/admin/add-product',
    editing: false,
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user,
    // conveniently you can pass the entire user Object from the request
    // this is because in the the Product model file, 'userId' is of type ObjectId
    // therefore mongoose will retrieve the id automatically from the object
    // so we can avoid passing 'req.user._id' (not that it is a problem anyways)
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
        docTitle: 'Add Product',
        navPath: '/admin/edit-product',
        editing: editMode,
        product: product,
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
