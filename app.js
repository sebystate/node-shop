const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

const errorController = require('./controllers/error');

const sequelize = require('./util/database');
const Product = require('./models/product');
const User = require('./models/user');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order = require('./models/order');
const OrderItem = require('./models/order-item');

const app = express();

// View Engine
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Dummy user configuration
app.use((req, res, next) => {
  User.findByPk(1)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});

// Routes
app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

// association Product M:1 User
Product.belongsTo(User, {
  as: 'Current',
  foreignKey: 'userId',
  constraints: true,
  onDelete: 'CASCADE',
});

User.hasMany(Product);

// association User 1:1 Cart
User.hasOne(Cart);
Cart.belongsTo(User);

// Cart M:M Product (CartItem association table)
Cart.belongsToMany(Product, { through: CartItem });

// Order M:1 User
Order.belongsTo(User);
User.hasMany(Order)

// Order N:M Product (OrderItem association table)
Order.belongsToMany(Product, { through: OrderItem})

let loggedUser;
sequelize
  // .sync({ force: true })
  .sync()
  .then((result) => {
    return User.findByPk(1);
  })
  // create a dummy user
  .then((user) => {
    if (!user) {
      return User.create({
        name: 'Administrator',
        email: 'node-shop@admin.com',
      });
    }
    return user;
  })
  .then((user) => {
    loggedUser = user;
    return user.getCart();
  })
  .then(cart => {
    if(!cart) {
      return loggedUser.createCart();
    }
    return cart;
  })
  .then(cart => {
    app.listen(3000);
  })
  .catch((err) => console.log(err));
