const fs = require('fs');
const path = require('path');
const PDFDodument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 4;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalProducts;
  Product.find()
    .countDocuments()
    .then((totProducts) => {
      totalProducts = totProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render('shop/product-list', {
        docTitle: 'All Products',
        navPath: '/products',
        products: products,
        currentPage: page,
        hasPreviousPage: page > 1,
        previousPage: page - 1,
        hasNextPage: ITEMS_PER_PAGE * page < totalProducts,
        nextPage: page + 1,
        lastPage: Math.ceil(totalProducts / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.status = 500;
      return next(error);
    });
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
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.status = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  // url../?page=..
  const page = +req.query.page || 1;
  let totalProducts;

  Product.find()
    .countDocuments()
    .then((totProducts) => {
      totalProducts = totProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render('shop/index', {
        docTitle: 'Shop',
        navPath: '/',
        products: products,
        currentPage: page,
        hasPreviousPage: page > 1,
        previousPage: page - 1,
        hasNextPage: ITEMS_PER_PAGE * page < totalProducts,
        nextPage: page + 1,
        lastPage: Math.ceil(totalProducts / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.status = 500;
      return next(error);
    });
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
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.status = 500;
      return next(error);
    });
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
    .catch((err) => {
      const error = new Error(err);
      error.status = 500;
      return next(error);
    });
};

exports.postCartDeleteItem = (req, res, next) => {
  const productId = req.body.productId;
  req.user
    .removeFromCart(productId)
    .then((result) => {
      console.log('Item successfully deleted from the cart!');
      res.redirect('/cart');
    })
    .catch((err) => {
      const error = new Error(err);
      error.status = 500;
      return next(error);
    });
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
          email: req.user.email,
        },
        products: cartProducts,
        total: cart.total,
      });

      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch((err) => {
      const error = new Error(err);
      error.status = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then((orders) => {
      res.render('shop/orders', {
        docTitle: 'Your Orders',
        navPath: '/orders',
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.status = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        const error = new Error('No order found.');
        error.status = 404;
        return next(error);
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        const error = new Error('Unauthorized.');
        error.status = 401;
        return next(error);
      }
      const invoiceName = 'invoice-' + orderId + '.pdf';
      const invoicePath = path.join('data', 'invoices', invoiceName);

      // Create the pdf document
      const pdfDoc = new PDFDodument({ size: 'A4' });

      // Setting headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'inline; filename="' + invoiceName + '"'
      );

      // save the pdf in the server
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      // forward the pdf to the response
      pdfDoc.pipe(res);

      generateInvoice(pdfDoc, order);

      // When you are done, end() will close the open streams
      // therefore the pdf file will be saved and the response will be sent
      pdfDoc.end();

      /** Preloading Data Approach **/
      // readFile() will access the file, read the entire content into memory
      // and then return it with a response. For tiny files this  might be ok,
      // but you can cause memory overflow in the server if the files are too
      // large.

      /* fs.readFile(invoicePath, (err, data) => {
        if (err) {
          return next(err);
        }
          res.send(data);
      }); */

      /** Streaming Data Approach **/
      // First we create a ReadStream so it will allow us to read the data chuncks
      // by chunks. Then we foreward (pipe) the data read to the response (res),
      // that happens to be a WriteableStream
      // This means that the data will be downloaded step by step instead of
      // preloading the data into memory.

      /* const readStream = fs.createReadStream(invoicePath);
      readStream.pipe(res); */
    })
    .catch((err) => {
      next(err);
    });
};

/**
 * Generates an invoice with proper styling of the given order.
 * @param {*} doc pdf document where the invoice will be registered.
 * @param {*} order order of the invoice in question.
 */
function generateInvoice(doc, order) {
  doc
    .rect(0, 0, doc.page.width, doc.page.height)
    .fillAndStroke('#DDE3E3', '#DDE3E3');
  doc.fill('#404e4d').stroke();
  const X_INIT = 72;
  let x = X_INIT;
  let y = 100;
  doc
    .font('Times-Bold', 20)
    .text('Invoice', x, y, { underline: true, align: 'left' })
    .font('Times-Roman', 16)
    .text('Order N. ' + order._id.toString(), x, y, {
      underline: true,
      align: 'right',
    })
    .moveDown(1);

  doc.text('User E-mail: ' + order.user.email, { align: 'right' });
  y += 120;

  doc
    .font('Times-Roman', 14)
    .text('Product Name', x, y, { lineBreak: false, align: 'left' })
    .text('Product Price', x, y, { align: 'right' });
  y += 20;
  order.products.forEach((item) => {
    for (let i = 0; i < item.quantity; i++) {
      doc
        .font('Courier', 12)
        .text(item.product.title, x, y, { lineBreak: false, align: 'left' })
        .text(' $' + item.product.price, x, y, { align: 'right' });
      y += 20;
    }
    y += 7;
  });
  for (let i = 0; i < 75; i++) {
    doc.text('-', x, y, { lineBreak: false, align: 'left' });
    x = x + 6;
  }
  x = X_INIT;
  y += 20;
  doc
    .font('Times-Roman', 14)
    .text('Total Price:', x, y, { lineBreak: false, align: 'left' })
    .font('Courier', 14)
    .text('$' + order.total, x, y, { align: 'right' });

  doc.moveDown(5).font('Times-Roman', 14).text('Thank you and baj baj!!');
}

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
