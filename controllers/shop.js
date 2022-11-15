const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
  Product.find()
    // .cursor().eachAsync() if you are dealing with large amount of data
    // otherwise with just find() you get an array of the data
    .then((products) => {
      res.render('shop/product-list', {
        docTitle: 'All Products',
        navPath: '/products',
        products: products,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch((err) => console.log(err));
};

exports.getProduct = (req, res, next) => {
  const productId = req.params.productId;
  Product.findById(productId)
    // mongooose's findById() can get the id string and will convert it to an ObjectId automatically
    .then((product) => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('shop/product-detail', {
        docTitle: product.title,
        product: product,
        navPath: '/products',
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch((err) => console.log(err));
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render('shop/index', {
        docTitle: 'Shop',
        navPath: '/',
        products: products,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch((err) => console.log(err));
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then((user) => {
      const products = getCartProducts(user);
      res.render('shop/cart', {
        docTitle: 'Your Cart',
        navPath: '/cart',
        products: products,
        isAuthenticated: req.session.isLoggedIn
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
      res.redirect('/cart');
    })
    .catch((err) => console.log(err));
};

exports.postCartDeleteItem = (req, res, next) => {
  const productId = req.body.productId;
  req.user
    .removeFromCart(productId)
    .then((result) => {
      console.log('Item successfully deleted from the cart!');
      res.redirect('/cart');
    })
    .catch((err) => console.log(err));
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then((user) => {
      const cart = getCartProducts(user);
      const cartProducts = cart.products.map((i) => {
        return { product: i.item, quantity: i.quantity };
      });
      const order = new Order({
        user: {
          userId: req.user._id,
          username: req.user.username,
        },
        products: cartProducts,
        total: cart.total
      });
      
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch((err) => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then((orders) => {
      res.render('shop/orders', {
        docTitle: 'Your Orders¯',
        navPath: '/orders',
        orders: orders,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch((err) => console.log(err));
};

/**
 * Returns an array of products destructed from the given user's cart.
 * @param user which cart items we need to destruct into the array.
 * @returns array of products destructed from the user's cart.
 */
function getCartProducts(user) {
  const products = user.cart.items.map((item) => {
    return {
      item: {
        _id: item.productId._id,
        title: item.productId.title,
        price: item.productId.price,
        description: item.productId.description,
        imageUrl: item.productId.imageUrl,
      },
      quantity: item.quantity,
    };
  });
  
  let total = 0;
  products.forEach((element) => {
    total =
      Math.round(
        (element.item.price * element.quantity + total + Number.EPSILON) * 100
      ) / 100;
  });

  return {
    products: products,
    total: total,
  };
}
