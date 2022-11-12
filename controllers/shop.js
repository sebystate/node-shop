const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
  Product.fetchAll()
    .then((products) => {
      res.render('shop/product-list', {
        docTitle: 'All Products',
        navPath: '/products',
        products: products,
      });
    })
    .catch((err) => console.log(err));
};

exports.getProduct = (req, res, next) => {
  const productId = req.params.productId;
  // findAll approach
  /* Product.findAll({ where: { id: productId } })
    .then(products => {
      const foundProduct = products[0];
      res.render('shop/product-detail', {
        docTitle: foundProduct.title,
        product: foundProduct,
        navPath: '/products',
      });
    })
    .catch(err => console.log(err)); */

  // findByPk approach
  Product.findById(productId)
    .then((product) => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('shop/product-detail', {
        docTitle: product.title,
        product: product,
        navPath: '/products',
      });
    })
    .catch((err) => console.log(err));
};

exports.getIndex = (req, res, next) => {
  Product.fetchAll()
    .then((products) => {
      res.render('shop/index', {
        docTitle: 'Shop',
        navPath: '/',
        products: products,
      });
    })
    .catch((err) => console.log(err));
};

exports.getCart = (req, res, next) => {
  req.user
    .getCart()
    .then((cartProducts) => {
      res.render('shop/cart', {
        docTitle: 'Your Cart',
        navPath: '/cart',
        products: cartProducts,
      });
    })
    .catch((err) => console.log(err));
};

exports.postCart = (req, res, next) => {
  const productId = req.body.productId;
  Product.findById(productId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect('/cart');
    })
    .catch((err) => console.log(err));
};

exports.postCartDeleteItem = (req, res, next) => {
  const productId = req.body.productId;
  req.user
    .deleteCartItem(productId)
    .then((result) => {
      console.log('Item successfully deleted from the cart!');
      res.redirect('/cart');
    })
    .catch((err) => console.log(err));
};

exports.postOrder = (req, res, next) => {
  let fetchedCart;
  req.user
    .addOrder()
    .then((result) => {
      res.redirect('/orders');
    })
    .catch((err) => console.log(err));
};

exports.getOrders = (req, res, next) => {
  req.user
    .getOrders()
    .then((orders) => {
      res.render('shop/orders', {
        docTitle: 'Your Orders¯',
        navPath: '/orders',
        orders: orders,
      });
    })
    .catch((err) => console.log(err));
};
