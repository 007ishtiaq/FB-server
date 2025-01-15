const User = require("../models/user");
const Cart = require("../models/cart");
const Product = require("../models/product");
const Coupon = require("../models/coupon");
const coupon = require("../models/coupon");
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

exports.createPaymentIntent = async (req, res) => {
  const { coupon } = req.body;

  const user = await User.findOne({ email: req.user.email }).exec();
  const { cartTotal, shippingfee, totalAfterDiscount } = await Cart.findOne({
    orderdBy: user._id,
  }).exec();

  let finalAmount = 0;

  if (coupon && coupon.applied && totalAfterDiscount) {
    finalAmount = totalAfterDiscount * 100;
  } else {
    finalAmount = (cartTotal + shippingfee) * 100;
  }
  const paymentIntent = await stripe.paymentIntents.create({
    amount: finalAmount,
    currency: "usd",
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
    cartTotal,
    totalAfterDiscount,
    payable: finalAmount,
  });
};
