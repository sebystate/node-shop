const Product = require('../models/product');
const Cart = require('../models/cart');

exports.getProducts = (req, res, next) => {
  Product.fetchAll()
    .then(([rows]) => {
      res.render('shop/product-list', {
        docTitle: 'All Products',
        navPath: '/products',
        products: rows,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const productId = req.params.productId;
  Product.findById(productId)
    .then(([rows]) => {
      const product = rows[0];
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
    .then(([rows]) => {
      res.render('shop/index', {
        docTitle: 'Shop',
        navPath: '/',
        products: rows,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  Cart.getCart((cart) => {
    Product.fetchAll((products) => {
      const cartProducts = [];
      for (let product of products) {
        const cartProductData = cart.products.find((p) => p.id === product.id);
        if (cartProductData) {
          cartProducts.push({ productData: product, qty: cartProductData.qty });
        }
      }
      res.render('shop/cart', {
        docTitle: 'Your Cart',
        navPath: '/cart',
        products: cartProducts,
      });
    });
  });
};

exports.postCart = (req, res, next) => {
  const productId = req.body.productId;
  Product.findById(productId, (product) => {
    Cart.addProduct(productId, product.price);
    res.redirect('/cart');
  });
};

exports.postCartDeleteItem = (req, res, next) => {
  const productId = req.body.productId;
  Product.findById(productId, (product) => {
    Cart.deleteProduct(productId, product.price);
    res.redirect('/cart');
  });
};

exports.getOrders = (req, res, next) => {
  res.render('shop/orders', {
    docTitle: 'Your Orders¯',
    navPath: '/orders',
  });
};

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    docTitle: 'Checkout',
    navPath: '/checkout',
  });
};
