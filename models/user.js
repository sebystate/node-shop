const { ObjectId } = require('mongodb');
const { getDb } = require('../util/database');

class User {
  constructor(username, email, cart, id) {
    this.username = username;
    this.email = email;
    this.cart = cart; // : { items: [ {productId: 3fa2h94 , quantity: 4}, {...} ] }
    this._id = id;
  }

  save() {
    const db = getDb();
    return db.collection('users').insertOne(this);
  }

  addToCart(product) {
    const cartItemIndex = this.cart.items.findIndex((cartItem) => {
      // these are not tecnically strings, so we need to use toString()
      return cartItem.productId.toString() === product._id.toString();
      // another workaround would be to use == instead
    });

    // create a copy of the cart items array
    const cartItemsCopy = [...this.cart.items];

    let newQuantity = 1;
    if (cartItemIndex >= 0) {
      // if the product is already inside the cart, update it's quantity by one
      newQuantity = this.cart.items[cartItemIndex].quantity + 1;
      cartItemsCopy[cartItemIndex].quantity = newQuantity;
    } else {
      // add a new cart item in the cart
      cartItemsCopy.push({
        productId: new ObjectId(product._id),
        quantity: newQuantity,
      });
    }

    // update the cart for this user
    const db = getDb();
    return db
      .collection('users')
      .updateOne(
        { _id: new ObjectId(this._id) },
        { $set: { cart: { items: cartItemsCopy } } }
      );
  }

  getCart() {
    const db = getDb();
    // array of the product's ids inside the user's cart
    const productIds = this.cart.items.map((cartItem) => {
      return cartItem.productId;
    });

    // return all the products which ids are in the array productIds
    return db
      .collection('products')
      .find({ _id: { $in: productIds } })
      .toArray()
      .then((productsArr) => {
        return productsArr.map((product) => {
          // each product will have the product properties + the quantity property
          return {
            ...product,
            quantity: this.cart.items.find((cartItem) => {
              return cartItem.productId.toString() === product._id.toString();
            }).quantity,
          };
        });
      })
      .catch((err) => console.log(err));
  }

  deleteCartItem(productId) {
    // remove the product to delete from the cart items
    const cartItemsCopy = this.cart.items.filter((item) => {
      return item.productId.toString() !== productId.toString();
    });

    // update the cart
    const db = getDb();
    return db
      .collection('users')
      .updateOne(
        { _id: new ObjectId(this._id) },
        { $set: { cart: { items: cartItemsCopy } } }
      );
  }

  addOrder() {
    const db = getDb();
    return this.getCart()
      .then((cartProducts) => {
        const order = {
          items: cartProducts,
          user: {
            _id: new ObjectId(this._id),
            username: this.username,
          },
        };
        return db.collection('orders').insertOne(order);
      })
      .then((result) => {
        this.cart = { items: [] };
        return db
          .collection('users')
          .updateOne(
            { _id: new ObjectId(this._id) },
            { $set: { cart: { items: [] } } }
          );
      });
  }

  getOrders() {
    const db = getDb();
    return db
      .collection('orders')
      .find({ 'user._id': new ObjectId(this._id) })
      .toArray();
  }

  static findById(userId) {
    const db = getDb();
    return db
      .collection('users')
      .findOne({ _id: new ObjectId(userId) })
      .then((user) => {
        console.log(user);
        return user;
      })
      .catch((err) => console.log(err));
  }
}

module.exports = User;
