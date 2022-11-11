const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
  Product.findAll().then((products) => {
    res.render('shop/product-list', {
      docTitle: 'All Products',
      navPath: '/products',
      products: products,
    });
  });
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
  Product.findByPk(productId)
    .then((product) => {
      res.render('shop/product-detail', {
        docTitle: product.title,
        product: product,
        navPath: '/products',
      });
    })
    .catch((err) => console.log(err));
};

exports.getIndex = (req, res, next) => {
  Product.findAll()
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
    .then((cart) => {
      return cart
        .getProducts()
        .then((cartProducts) => {
          res.render('shop/cart', {
            docTitle: 'Your Cart',
            navPath: '/cart',
            products: cartProducts,
          });
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
};

exports.postCart = (req, res, next) => {
  const productId = req.body.productId;
  let fetchedCart;
  let newQuantity = 1;
  req.user
    .getCart()
    .then((cart) => {
      fetchedCart = cart;
      return cart.getProducts({ where: { id: productId } });
    })
    // we obtain an array, but we need only the cartItem product
    .then((products) => {
      let product;
      if (products.length > 0) {
        product = products[0];
      }
      // if that product is in the cart, make sure to update it's quantity by 1
      if (product) {
        const oldQuantity = product.cartItem.quantity;
        newQuantity = oldQuantity + 1;
        return product;
      }
      return Product.findByPk(productId);
    })
    .then((product) => {
      return fetchedCart.addProduct(product, {
        through: { quantity: newQuantity },
      });
    })
    .then(() => {
      res.redirect('/cart');
    })
    .catch((err) => console.log(err));
};

exports.postCartDeleteItem = (req, res, next) => {
  const productId = req.body.productId;
  let product;
  req.user
    .getCart()
    .then((cart) => {
      return cart.getProducts({ where: { id: productId } });
    })
    .then((products) => {
      product = products[0];
      console.log("Deleting cart item '" + product.title + "' ...");
      return product.cartItem.destroy();
    })
    .then((result) => {
      console.log(
        "Item '" + product.title + "' successfully deleted from the cart!"
      );
      res.redirect('/cart');
    })
    .catch((err) => console.log(err));
};

exports.postOrder = (req, res, next) => {
  let fetchedCart;
  req.user
    .getCart()
    .then((cart) => {
      fetchedCart = cart;
      return cart.getProducts();
    })
    .then((products) => {
      return req.user
        .createOrder()
        .then((order) => {
          return order.addProducts(
            products.map((prodElement) => {
              prodElement.orderItem = {
                quantity: prodElement.cartItem.quantity,
              };
              return prodElement;
            })
          );
        })
        .catch((err) => console.log(err));
    })
    .then((result) => {
      return fetchedCart.setProducts(null);
    })
    .then((result) => {
      res.redirect('/orders');
    })
    .catch((err) => console.log(err));
};

exports.getOrders = (req, res, next) => {
  req.user
    .getOrders({ include: ['products'] })
    .then((orders) => {
      res.render('shop/orders', {
        docTitle: 'Your Orders¯',
        navPath: '/orders',
        orders: orders,
      });
    })
    .catch((err) => console.log(err));
};
