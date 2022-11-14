const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Product = require('./product');

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product', // this is not really needed as the cart is an embedded document, so it's implicit that the productId will be an ObjectId referred to the products collection
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

userSchema.methods.addToCart = function (product) {
  const cartItemIndex = this.cart.items.findIndex((cartItem) => {
    return cartItem.productId.toString() === product._id.toString();
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
      productId: product._id, // mongoose will wrap it in an ObjectId
      quantity: newQuantity,
      
    });
  }

  // update the user's cart and save the user
  this.cart.items = cartItemsCopy;
  return this.save();
};

userSchema.methods.removeFromCart = function (productId) {
  //remove the product to delete from the cart items
  const cartItemsCopy = this.cart.items.filter((item) => {
    return item.productId.toString() !== productId.toString();
  });

  // update the user's cart and save the user
  this.cart.items = cartItemsCopy;
  return this.save();
};

userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
